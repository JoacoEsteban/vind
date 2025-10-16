import {
  BehaviorSubject,
  EMPTY,
  Observable,
  defer,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  of,
  pairwise,
  share,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs'
import type { PageController } from './page-controller'
import { log } from './log'
import { PromiseWithResolvers } from './polyfills'
import {
  getClosestBindableElement,
  addClickTargetToElement,
  recordInputKey,
  waitForKeyDown,
  type KeyDownEmitter,
} from './element'
import { Binding } from './binding'
import {
  debug,
  exposeSubject,
  isPressingKey$,
  shareLatest,
  throttleTimeLeadTrail,
} from './rxjs'
import { RegistrationAbortedError, UnkownError, VindError } from './error'
import { buildXPathAndResolveToUniqueElement, XPathObject } from './xpath'
import { match } from 'ts-pattern'
import type { Domain, Path } from './url'
import { RegistrationSuccess, Success } from './Event'
import type { CrossFrameEventsController } from './cross-frame-keyboard-events'
import { not } from './misc'

export enum RegistrationState {
  Idle,
  SelectingElement,
  SelectingKey,
  SavingBinding,
}

export enum ElementSelectionState {
  Idle,
  Selecting,
  Paused,
}

export class RegistrationController {
  private registrationInProgress$$ = new BehaviorSubject<boolean>(false)
  public registrationInProgress$ = this.registrationInProgress$$.asObservable()
  public isRegistrationInProgress = exposeSubject(this.registrationInProgress$$)

  private registrationState$$ = new BehaviorSubject<RegistrationState>(
    RegistrationState.Idle,
  )
  public registrationState$ = this.registrationState$$.asObservable()
  public getRegistrationState = exposeSubject(this.registrationState$$)

  private mouseOverElements$ = fromEvent<MouseEvent>(
    document,
    'mousemove',
  ).pipe(
    throttleTimeLeadTrail(20),
    map(
      (e) => document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[],
    ),
  )

  private targetedElement$ = this.mouseOverElements$.pipe(
    map<HTMLElement[], HTMLElement | null>((els) => {
      for (const el of els) {
        const match = getClosestBindableElement(el)
        if (match) return match
      }
      return null
    }),
    distinctUntilChanged(),
    share(),
  )

  private elementSelectionTarget$ = new Observable<null | {
    target: HTMLElement
    el: HTMLElement
  }>((sub) => {
    const target$ = this.targetedElement$.pipe(
      map(
        (target) =>
          target && {
            target: addClickTargetToElement(target) as HTMLElement,
            el: target,
          },
      ),
    )

    const filteredTarget$ = this.elementSelectionState$.pipe(
      switchMap((state) =>
        match(state)
          .with(ElementSelectionState.Selecting, () => target$)
          .otherwise(() => of(null)),
      ),
      tap((el) => sub.next(el)),
    )

    filteredTarget$
      .pipe(
        pairwise(),
        tap(([prev]) => prev && document.body.removeChild(prev.target)),
      )
      .subscribe()
  }).pipe(shareLatest())

  public currentElementSelectionTarget$ = this.elementSelectionTarget$.pipe(
    map((el) => el && el.el),
  )

  public elementSelectionEnabled$ = defer(() =>
    isPressingKey$(this.keyboardController.channel$, 'Alt'),
  ).pipe(map(not), shareLatest())

  public elementSelectionState$ = this.registrationState$$.pipe(
    switchMap((state) =>
      match(state)
        .with(RegistrationState.SelectingElement, () =>
          this.elementSelectionEnabled$.pipe(
            map((enabled) =>
              enabled
                ? ElementSelectionState.Selecting
                : ElementSelectionState.Paused,
            ),
          ),
        )
        .otherwise(() => of(ElementSelectionState.Idle)),
    ),
    shareLatest(),
  )

  constructor(
    private pageControllerInstance: PageController,
    private keyboardController: CrossFrameEventsController,
  ) {}

  async register(domain: Domain, path: Path) {
    if (this.registrationInProgress$$.value) {
      throw new Error('Registration already in progress')
    }
    this.registrationInProgress$$.next(true)

    const aborter = escapeKeyAborter(this.keyboardController as KeyDownEmitter)

    return this.startRegistrationFlow(aborter.signal, domain, path).finally(
      () => {
        log.info('Registration finished')
        aborter.abort(new RegistrationSuccess()) // cleanup
        this.registrationInProgress$$.next(false)
        this.setRegistrationState(RegistrationState.Idle)
      },
    )
  }

  cancelRegistration() {
    if (!this.registrationInProgress$$.value) {
      throw new Error('No registration in progress')
    }
    this.registrationInProgress$$.next(false)
  }

  private setRegistrationState(state: RegistrationState) {
    this.registrationState$$.next(state)
  }

  private async startRegistrationFlow(
    abortSignal: AbortSignal,
    domain: Domain,
    path: Path,
  ) {
    this.setRegistrationState(RegistrationState.SelectingElement)
    const [selectedElement, xpathObject, selector] =
      await this.selectElement(abortSignal)
    // ----------------------------------------------
    this.setRegistrationState(RegistrationState.SelectingKey)
    const key = await this.selectKey(abortSignal)
    // ----------------------------------------------
    this.setRegistrationState(RegistrationState.SavingBinding)

    const binding = new Binding(domain, path, key, selector, xpathObject)
    log.info('Saving binding:', binding)
    // ----------------------------------------------
    return this.pageControllerInstance.bindingsChannel.addBinding(binding)
  }

  private async selectElement(
    abortSignal: AbortSignal,
  ): Promise<[HTMLElement, XPathObject, string]> {
    if (abortSignal.aborted) {
      throw abortSignal.reason
    }

    const {
      promise: selectedElement,
      resolve: confirmElement,
      reject: cancel,
    } = PromiseWithResolvers<[HTMLElement, XPathObject, string]>()
    abortSignal.addEventListener('abort', () => cancel(abortSignal.reason))

    const clickToElements = () =>
      fromEvent<MouseEvent>(document, 'click').pipe(
        withLatestFrom(this.elementSelectionTarget$),
        filter(([click, target]) =>
          Boolean(
            target &&
              document
                .elementsFromPoint(click.clientX, click.clientY)
                .includes(target.target),
          ),
        ),
        map(([, target]) => target!),
      )

    const sub = this.elementSelectionState$
      .pipe(
        switchMap((state) =>
          match(state)
            .with(ElementSelectionState.Selecting, clickToElements)
            .otherwise(() => EMPTY),
        ),
      )
      .subscribe(async (val) => {
        const { el } = val
        const result = await buildXPathAndResolveToUniqueElement(el)

        match(result.ok)
          .with(true, () => {
            log.info('XPATH', result.val)
            const [xpathObject, selector] = result.val as [XPathObject, string]
            confirmElement([el, xpathObject, selector])
          })
          .with(false, () => {
            const err = result.val as Error
            cancel(err instanceof VindError ? err : new UnkownError())
          })
      })

    await selectedElement
      .catch((err) => {
        log.info('on error @ selectElement', err)
        throw err
      })
      .finally(() => sub.unsubscribe())

    return selectedElement
  }

  async selectKey(abortSignal: AbortSignal): Promise<string> {
    if (abortSignal.aborted) {
      throw abortSignal.reason
    }

    const onKey = recordInputKey(abortSignal)

    const key = await onKey.catch((err) => {
      log.info('on error @ selectKey onkey', err)
      throw err
    })

    if (!key) {
      throw new Error('No key selected')
    }

    log.info('selected key', key)
    return key
  }
}

export function escapeKeyAborter(emitter: KeyDownEmitter = document) {
  const aborter = new AbortController()
  waitForKeyDown('Escape', aborter.signal, emitter)
    .then(() => {
      log.warn('Registration aborted')
      aborter.abort(new RegistrationAbortedError())
    })
    .catch((err) => {
      if (!(err instanceof Success)) {
        throw err
      }
    })
  return aborter
}

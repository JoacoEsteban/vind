import {
  BehaviorSubject,
  Subject,
  combineLatest,
  filter,
  fromEvent,
  last,
  map,
  pairwise,
  share,
  takeUntil,
  tap,
  throttleTime,
} from 'rxjs'
import type { PageController } from './page-controller'
import { log } from './log'
import { PromiseWithResolvers } from './polyfills'
import {
  getClosestBindableElement,
  highlightElement,
  isConfirmableElement,
  recordInputKey,
  waitForKeyDown,
} from './element'
import { Binding } from './binding'
import { exposeSubject, PromiseStopper, unwrapPromise } from './rxjs'
import {
  RegistrationAbortedError,
  UnbindableElementError,
  UnkownError,
  VindError,
} from './error'
import { buildXPathAndResolveToUniqueElement, XPathObject } from './xpath'
import { match } from 'ts-pattern'
import type { Domain, Path } from './url'
import { RegistrationSuccess, Success } from './Event'

export enum RegistrationState {
  Idle,
  SelectingElement,
  SelectingKey,
  SavingBinding,
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
    throttleTime(20),
    map(
      (e) => document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[],
    ),
    share(),
  )

  private targetedElement$ = this.mouseOverElements$.pipe(
    map<HTMLElement[], HTMLElement | null>((els) => {
      for (const el of els) {
        const match = getClosestBindableElement(el)
        if (match) return match
      }
      return null
    }),
    pairwise(),
    filter(([prev, next]) => prev !== next), // only emit when element changes
    map(([_, next]) => next),
    share(),
  )

  constructor(private pageControllerInstance: PageController) {}

  async register(domain: Domain, path: Path) {
    if (this.registrationInProgress$$.value) {
      throw new Error('Registration already in progress')
    }
    this.registrationInProgress$$.next(true)

    const aborter = escapeKeyAborter()

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
    const onElement = this.selectElement(abortSignal)
    this.highlightCurrentElement(PromiseStopper(onElement).stopper)
    const [selectedElement, xpathObject, selector] = await onElement
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

    const sub = combineLatest([
      this.targetedElement$.pipe(filter(Boolean)),
      fromEvent<MouseEvent>(document, 'click').pipe(
        filter(isConfirmableElement),
      ),
    ]).subscribe(async (val) => {
      const [element] = val
      const result = await buildXPathAndResolveToUniqueElement(element)

      match(result.ok)
        .with(true, () => {
          log.info('XPATH', result.val)
          const [xpathObject, selector] = result.val as [XPathObject, string]
          confirmElement([element, xpathObject, selector])
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

  // ----------------------------------------------
  private highlightCurrentElement(stopper: Subject<any>) {
    // let toastId = ''
    const element$ = this.targetedElement$.pipe(
      takeUntil(stopper),
      map((el) => el && (highlightElement(el) as HTMLElement)),
      share(),
    )

    element$
      .pipe(
        pairwise(),
        tap(([prev, _]) => {
          prev && document.body.removeChild(prev)
        }),
      )
      .subscribe()

    element$.pipe(last()).forEach((last) => {
      last && document.body.removeChild(last)
    })
  }
}

export function escapeKeyAborter() {
  const aborter = new AbortController()
  waitForKeyDown('Escape', aborter.signal)
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

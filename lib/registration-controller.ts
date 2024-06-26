import { BehaviorSubject, Subject, combineLatest, filter, fromEvent, last, map, pairwise, share, takeUntil, tap, throttleTime } from 'rxjs'
import type { PageController } from './page-controller'
import { log } from './log'
import { PromiseWithResolvers } from './polyfills'
import { getClosestBindableElement, highlightElement, isConfirmableElement, isHighlightableElement, recordInputKey, waitForKeyDown } from './element'
import { Binding } from './binding'
import { exposeSubject, PromiseStopper } from './rxjs'
import { RegistrationAbortedError, UnbindableElementError } from './error'
import { getXPath } from './xpath'
import { match } from 'ts-pattern'
import type { Domain, Path } from './url'

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

  private registrationState$$ = new BehaviorSubject<RegistrationState>(RegistrationState.Idle)
  public registrationState$ = this.registrationState$$.asObservable()
  public getRegistrationState = exposeSubject(this.registrationState$$)

  private mouseOverElements$ = fromEvent<MouseEvent>(document, 'mousemove')
    .pipe(
      throttleTime(20),
      map((e) =>
        document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[]
      ),
      share()
    )

  private targetedElement$ = this.mouseOverElements$
    .pipe(
      map<HTMLElement[], HTMLElement | null>((els) =>
        els.find(isHighlightableElement) || null
      ),
      filter(Boolean),
      pairwise(),
      filter(([prev, next]) => prev !== next), // only emit when element changes
      map(([_, next]) => {
        return next
      }),
      map(getClosestBindableElement),
      filter(Boolean),
      share()
    )

  constructor(
    private pageControllerInstance: PageController
  ) {}

  async register (domain: Domain, path: Path) {
    if (this.registrationInProgress$$.value) {
      throw new Error('Registration already in progress')
    }
    this.registrationInProgress$$.next(true)

    const aborter = new AbortController()
    waitForKeyDown('Escape', aborter.signal)
      .then(() => {
        log.warn('Registration aborted')
        aborter.abort(new RegistrationAbortedError())
      })

    return this.startRegistrationFlow(aborter.signal, domain, path)
      .finally(() => {
        log.info('Registration finished')
        aborter.abort() // cleanup
        this.registrationInProgress$$.next(false)
        this.setRegistrationState(RegistrationState.Idle)
      })
  }

  cancelRegistration () {
    if (!this.registrationInProgress$$.value) {
      throw new Error('No registration in progress')
    }
    this.registrationInProgress$$.next(false)
  }

  private setRegistrationState (state: RegistrationState) {
    this.registrationState$$.next(state)
  }

  private async startRegistrationFlow (abortSignal: AbortSignal, domain: Domain, path: Path) {
    this.setRegistrationState(RegistrationState.SelectingElement)
    const onElement = this.selectElement(abortSignal)
    this.highlightCurrentElement(PromiseStopper(onElement).stopper)
    const selectedElement = await onElement
    // ----------------------------------------------
    this.setRegistrationState(RegistrationState.SelectingKey)
    const key = await this.selectKey(abortSignal)
    // ----------------------------------------------
    this.setRegistrationState(RegistrationState.SavingBinding)

    const binding = Binding.fromElement(selectedElement, key, domain, path)
    log.info('Saving binding:', binding)
    // ----------------------------------------------
    return this.pageControllerInstance.bindingsChannel.addBinding(binding)
  }

  private async selectElement (abortSignal: AbortSignal): Promise<HTMLElement> {
    if (abortSignal.aborted) {
      throw abortSignal.reason
    }

    const { promise: selectedElement, resolve: confirmElement, reject: cancel } = PromiseWithResolvers<HTMLElement>()
    abortSignal.addEventListener('abort', () => cancel(abortSignal.reason))

    const sub = combineLatest([
      this.targetedElement$,
      fromEvent<MouseEvent>(document, 'click')
        .pipe(filter(isConfirmableElement))
    ])
      .subscribe((val) => {
        const [element] = val
        const result = getXPath(element)

        match(result.ok)
          .with(true, () => {
            log.info('XPATH', result.val)
            confirmElement(element)
          })
          .with(false, () => {
            cancel(new UnbindableElementError())
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

  private async selectKey (abortSignal: AbortSignal): Promise<string> {
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
  private highlightCurrentElement (stopper: Subject<any>) {
    const element$ = this.targetedElement$
      .pipe(
        takeUntil(stopper),
        map((el) => highlightElement(el)),
        share()
      )

    element$.pipe(
      pairwise(),
      tap(([prev, _]) => {
        document.body.removeChild(prev)
      })
    ).subscribe()

    element$.pipe(last())
      .forEach((last) => document.body.removeChild(last))
  }
}
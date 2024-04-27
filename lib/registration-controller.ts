import { BehaviorSubject } from 'rxjs'
import type { PageController } from './page-controller'
import { log } from './log'
import { PromiseWithResolvers } from './polyfills'
import { highlightElementUntilLeave, isBindableElement, recordInputKey, waitForKeyDown } from './element'
import { getElementByXPath, getXPath } from './xpath'
import { makeEventListenerStack } from '@solid-primitives/event-listener'
import { Binding } from './binding'
import { exposeSubject } from './rxjs'
import { match } from 'ts-pattern'
import { RegistrationAbortedError } from './error'

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

  constructor(
    private pageControllerInstance: PageController
  ) {}

  async register () {
    if (this.registrationInProgress$$.value) {
      throw new Error('Registration already in progress')
    }
    this.registrationInProgress$$.next(true)

    return this.startRegistrationFlow()
      .finally(() => {
        log.info('Registration finished')
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

  private async startRegistrationFlow () {
    const aborter = new AbortController()

    waitForKeyDown('Escape', aborter.signal)
      .then(() => aborter.abort(new RegistrationAbortedError()))

    this.setRegistrationState(RegistrationState.SelectingElement)
    const highlightedElement = await this.selectElement(aborter.signal)

    this.setRegistrationState(RegistrationState.SelectingKey)
    const key = await this.selectKey(aborter.signal)

    this.setRegistrationState(RegistrationState.SavingBinding)
    const binding = Binding.fromElement(highlightedElement, key)

    log.info('Saving binding:', binding)

    return this.pageControllerInstance.bindingsChannel.addBinding(binding)
  }

  private async selectElement (abortSignal: AbortSignal): Promise<HTMLElement> {
    if (abortSignal.aborted) {
      throw abortSignal.reason
    }

    const onAborted = new Promise((resolve, reject) => {
      abortSignal.addEventListener('abort', () => reject(abortSignal.reason))
    })

    let highlightedElement: HTMLElement | null = null

    const { resolve: confirmElement, reject: cancel, promise: onElementSelected } = PromiseWithResolvers<void>()
    onAborted.catch(cancel)

    const mouseoverListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!isBindableElement(target)) {
        return
      }

      highlightedElement = target

      const { cancel } = highlightElementUntilLeave(target)
      onElementSelected.finally(cancel)
    }

    const clickListener = (event: MouseEvent) => {
      if (!highlightedElement) {
        return
      }

      log.info('CLICKKK')
      event.preventDefault()
      event.stopPropagation()

      const result = getXPath(highlightedElement)

      match(result.ok)
        .with(true, () => {
          console.log('XPATH', result.val)
          confirmElement()
        })
        .with(false, () => {
          log.error('Error getting xpath', result.err)
          cancel()
        })

      confirmElement()
    }

    const [listen, clear] = makeEventListenerStack(document, {
      signal: abortSignal,
      passive: true,
      capture: true,
    })

    listen('mouseover', mouseoverListener)
    listen('mousedown', clickListener)

    log.info('Waiting for element selection')
    await onElementSelected
      .finally(() => {
        clear()
      })

    if (!highlightedElement) {
      throw new Error('No element selected')
    }

    log.info('Element selected')

    return highlightedElement
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
}
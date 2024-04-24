import { BehaviorSubject } from 'rxjs'
import type { PageController } from './page-controller'
import { log } from './log'
import { PromiseWithResolvers } from './polyfills'
import { highlightElementUntilLeave, isBindableElement, recordInputKey } from './element'
import { getElementByXPath, getXPath } from './xpath'
import { makeEventListenerStack } from '@solid-primitives/event-listener'
import { Binding } from './binding'

export class RegistrationController {
  registrationInProgress$ = new BehaviorSubject<boolean>(false)
  constructor(
    private pageControllerInstance: PageController
  ) {}

  async register () {
    if (this.registrationInProgress$.value) {
      throw new Error('Registration already in progress')
    }
    this.registrationInProgress$.next(true)

    return this.startRegistrationFlow()
      .finally(() => {
        log.info('Registration finished')
        this.registrationInProgress$.next(false)
      })
  }

  cancelRegistration () {
    if (!this.registrationInProgress$.value) {
      throw new Error('No registration in progress')
    }
    this.registrationInProgress$.next(false)
  }

  private async startRegistrationFlow () {
    let highlightedElement: HTMLElement | null = null
    const { resolve: confirmElement, reject: cancel, promise: onElementSelected } = PromiseWithResolvers<void>()

    const mouseoverListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!isBindableElement(target)) {
        return
      }

      highlightedElement = target

      const { cancel } = highlightElementUntilLeave(target)
      onElementSelected.then(cancel)
    }

    const clickListener = (event: MouseEvent) => {
      if (!highlightedElement) {
        return
      }

      log.info('CLICKKK')
      event.preventDefault()
      event.stopPropagation()

      const selector = getXPath(highlightedElement)

      log.info('clicked', selector, getElementByXPath(selector))
      confirmElement()
    }

    const [listen, clear] = makeEventListenerStack(document, {
      passive: true,
      capture: true,
    })

    listen('mouseover', mouseoverListener)
    listen('mousedown', clickListener)
    listen('keydown', (event) => event.key === 'Escape' && cancel())

    log.info('Waiting for element selection')
    await onElementSelected
      .finally(() => {
        clear()
      })

    log.info('Element selected')

    if (!highlightedElement) {
      throw new Error('No element selected')
    }

    const key = await recordInputKey()
    log.info('selected key', key)

    const binding = Binding.fromElement(highlightedElement, key)
    log.info('Saving binding:', binding)

    return this.pageControllerInstance.bindingsChannel.addBinding(binding)
  }
}
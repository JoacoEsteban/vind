import { Binding, getBindings, getBindingsForSite } from '~lib/binding'
import { log } from './log'
import { Observable, Subscriber, BehaviorSubject } from 'rxjs'
import { sanitizeHref } from './url'

export class PageController {
  private currentUrlSubject: BehaviorSubject<string> = new BehaviorSubject<string>('')
  private bindingsSubject: BehaviorSubject<Binding[]> = new BehaviorSubject<Binding[]>([])

  $bindings = this.bindingsSubject.asObservable()
  $currentUrl = this.currentUrlSubject.asObservable()

  async updateBindings () {
    log.info('Updating bindings')
    const sanitizedUrl = sanitizeHref(window.location.href)

    if (this.currentUrlSubject.value === sanitizedUrl) {
      log.info(`URL is the same (${this.currentUrlSubject.value}, ${sanitizedUrl}), not updating`)
      return
    }

    const bindings = await getBindingsForSite(sanitizedUrl)

    this.bindingsSubject.next(bindings)
    this.currentUrlSubject.next(sanitizedUrl)

    log.info('Bindings updated:', bindings)
  }

  getMatchingKey (event: KeyboardEvent): string | null {
    if (event.target instanceof HTMLInputElement) {
      return null
    }

    log.info(`Matching key pressed: "${event.key}"`)
    return event.key
  }

  triggerBindingsByKey (key: string) {
    const matchingBindings = this.bindingsSubject.value.filter(binding => binding.key === key)
    return this.triggerBindings(matchingBindings)
  }

  async triggerBindings (bindings: Binding[]): Promise<void[]> {
    return Promise.all(bindings.map(async binding => {
      log.info('triggering binding', binding)
      return this.clickBinding(binding)
    }))
  }

  async click (element: HTMLElement) {
    // TODO do workaround
    await new Promise<void>((resolve) => {
      element.addEventListener('click', function onClick (e) {
        element.removeEventListener('click', onClick)
        if (e.defaultPrevented)
          element.click()

        resolve()
      })
      element.click()
    })
  }

  async clickBinding (binding: Binding) {
    const element = binding.getElement()
    if (element) {
      await this.click(element)
    } else {
      console.log('no element found for binding', binding)
    }
  }

  async focusBinding (binding: Binding) {
    const element = binding.getElement()
    if (element) {
    }
  }

  async blurBinding (binding: Binding) {
    const element = binding.getElement()
    if (element) {
    }
  }

  onKeyPress (e: KeyboardEvent) {
    const key = this.getMatchingKey(e)
    if (key) {
      this.triggerBindingsByKey(key)
    }
  }
}
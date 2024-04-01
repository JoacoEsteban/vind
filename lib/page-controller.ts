import { Binding, bindingsAsUrlMap } from '~lib/binding'
import { log } from './log'
import { BehaviorSubject, map, merge } from 'rxjs'
import { getCurrentUrl } from './url'
import { BindingChannelImpl } from './messages'

export class PageController {
  constructor(
    public pageType: 'content-script' | 'options'
  ) {}

  public bindingsChannel = new BindingChannelImpl()

  private currentUrlSubject: BehaviorSubject<URL | null> = new BehaviorSubject<URL | null>(null)
  public currentSite$ = this.currentUrlSubject.pipe(
    map((url) => url?.href || '')
  )
  private bindingsSubject: BehaviorSubject<Binding[]> = new BehaviorSubject<Binding[]>([])

  public onBindingRemoved$ = this.bindingsChannel.onBindingRemoved$
  public onBindingAdded$ = this.bindingsChannel.onBindingAdded$
  public onBindingUpdated$ = this.bindingsChannel.onBindingUpdated$

  public onEveryBindingEvent$ = merge(
    this.onBindingRemoved$,
    this.onBindingAdded$,
    this.onBindingUpdated$
  )

  public bindings$ = this.bindingsSubject.asObservable()
  public bindingsMap$ = this.bindings$.pipe(
    map((bindings) => {
      return bindingsAsUrlMap(bindings)
    })
  )

  async softUpdateBindings () {
    log.info('Soft updating bindings')
    const currentUrl = getCurrentUrl()

    if (this.currentUrlSubject.value?.href === currentUrl.href) {
      log.info(`URL is the same (${this.currentUrlSubject.value}, ${currentUrl}), not updating`)
      return
    }

    this.updateBindings()
  }

  async updateBindings () {
    if (this.pageType === 'options') {
      return this.loadAllBindings()
    }

    log.info('Updating bindings')
    const currentUrl = getCurrentUrl()
    const bindings = await this.bindingsChannel.getBindingsForSite(currentUrl)

    this.bindingsSubject.next(bindings)
    this.currentUrlSubject.next(currentUrl)

    log.info('Bindings updated:', bindings)
  }

  async loadAllBindings () {
    log.info('Loading all bindings')

    const bindings = await this.bindingsChannel.getAllBindings()

    this.bindingsSubject.next(bindings)

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
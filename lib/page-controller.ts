import { Binding, bindingsAsMap } from '~lib/binding'
import { log } from './log'
import { BehaviorSubject, Subject, combineLatest, filter, map, merge, share } from 'rxjs'
import { Domain, Path } from './url'
import { BindingChannelImpl } from './messages/bindings'
import { bindingOverlayId, highlightElement, isBindableKeydownEvent } from './element'
import { DisabledPathsChannelImpl } from './messages/disabled-paths'
import { expose } from './rxjs'
import { match } from 'ts-pattern'
import { sleep } from './control-flow'
import { InexistentElementError } from './error'

export class PageController {
  constructor(
    public pageType: 'content-script' | 'options',
    currentUrl: URL | null = null
  ) {

    if (currentUrl) {
      this.changeRoute(currentUrl)
    }

    this.onEveryBindingEvent$
      .subscribe(() => {
        log.info('Binding updated, refreshing bindings')
        this.refreshBindings()
      })
    this.onEveryDisabledPathEvent$
      .subscribe(() => {
        log.info('DisabledPath updated, refreshing disabled paths')
        this.refreshDisabledPaths()
      })

    this.currentUrlSubject
      .subscribe((url) => {
        this.updateResources(url)
      })
  }

  private triggeredBinding = new Subject<string>()
  public triggeredBinding$ = this.triggeredBinding.asObservable()

  private triggers = new Subject<Promise<unknown>>() // TODO type
  public triggers$ = this.triggers.asObservable()

  public bindingsChannel = new BindingChannelImpl()
  public disabledPathsChannel = new DisabledPathsChannelImpl()

  private currentUrlSubject: BehaviorSubject<URL | null> = new BehaviorSubject<URL | null>(null)
  public currentSite$ = this.currentUrlSubject.pipe(
    map((url) =>
      url?.href || ''
    )
  )
  public currentSiteSplitted$ = this.currentUrlSubject
    .pipe(filter((url) => url !== null))
    .pipe( // TODO find a better name
      map((url) => ({
        domain: new Domain(url!.host),
        path: new Path(url!.pathname),
      }))
    )
  private bindingsSubject: BehaviorSubject<Binding[]> = new BehaviorSubject<Binding[]>([])
  private disabledPathsSubject: BehaviorSubject<Set<string>> = new BehaviorSubject(new Set<string>())

  public onBindingRemoved$ = this.bindingsChannel.onBindingRemoved$
  public onBindingAdded$ = this.bindingsChannel.onBindingAdded$
  public onBindingUpdated$ = this.bindingsChannel.onBindingUpdated$

  public onEveryBindingEvent$ = merge(
    this.onBindingRemoved$,
    this.onBindingAdded$,
    this.onBindingUpdated$
  )

  public onDisabledBindingPathRemoved$ = this.disabledPathsChannel.onDisabledBindingPathRemoved$
  public onDisabledBindingPathAdded$ = this.disabledPathsChannel.onDisabledBindingPathAdded$

  public onEveryDisabledPathEvent$ = merge(
    this.onDisabledBindingPathRemoved$,
    this.onDisabledBindingPathAdded$,
  )

  public bindings$ = this.bindingsSubject.asObservable()
  public disabledDomainPaths$ = this.disabledPathsSubject.asObservable()

  public disabledPathsSet$ = this.disabledDomainPaths$.pipe(
    map((paths) =>
      new Set([...paths.values()].map((path) => new Path(path).value))
    )
  )

  public bindingsByPathMap$ = this.bindings$.pipe(
    map((bindings) =>
      bindingsAsMap(bindings)
    )
  )
  public currentDomainBindings$ = combineLatest([
    this.bindingsByPathMap$,
    this.currentSiteSplitted$
  ]).pipe(
    map(([bindingsMap, { domain }]) =>
      bindingsMap.get(domain.value) || new Map<Path['value'], Binding[]>()
    )
  )

  public domainBindingsByNesting$ = combineLatest([this.currentDomainBindings$, this.currentSiteSplitted$]).pipe(
    map(([domainBindingsMap, { path: currentPath }]) => {

      const returns = {
        enclosing: new Map<Path['value'], Binding[]>(),
        branching: new Map<Path['value'], Binding[]>(),
      }

      for (const [pathPattern, pathBindings] of domainBindingsMap) {
        let map = returns.branching

        if (new Path(pathPattern).matchStart(currentPath)) {
          map = returns.enclosing
        }

        map.set(pathPattern, pathBindings)
      }

      return returns
    })
  )

  public includedBindingPaths$ = combineLatest([this.domainBindingsByNesting$, this.disabledPathsSet$])
    .pipe(
      filter(([domainBindingsMap]) => domainBindingsMap !== null),
      map(([domainBindingsMap, disabledPaths]) => {
        const { enclosing, branching } = domainBindingsMap

        const includedPaths = new Set(enclosing.keys())

        for (const path of disabledPaths) {
          includedPaths.delete(path)
        }

        return includedPaths
      })
    )

  public enabledBindings$ = combineLatest([this.currentDomainBindings$, this.includedBindingPaths$])
    .pipe(
      map(([bindingsMap, includedBindingPaths]) => {
        return [...includedBindingPaths].flatMap(path => bindingsMap.get(path) || [])
      })
    )

  public enabledBindings = expose(this.enabledBindings$)
  public currentSiteSplitted = expose(this.currentSiteSplitted$)

  // ------------------------------------------

  async changeRoute (url: URL) {
    log.info('Changing route', url)

    if (this.currentUrlSubject.value?.href === url.href) {
      log.info(`URL is the same (${this.currentUrlSubject.value}, ${url}), not updating`)
      return
    }
    this.currentUrlSubject.next(url)
  }

  async refreshResources () {
    this.updateResources(this.currentUrlSubject.value)
  }

  async refreshBindings () {
    if (this.pageType === 'options') {
      return this.loadAllBindings()
    }

    if (!this.currentUrlSubject.value) {
      log.error('currentUrlSubject is null in refreshBindings')
      throw new Error('currentUrlSubject is null in refreshBindings')
    }

    this.updateBindings(this.currentUrlSubject.value)
  }

  async refreshDisabledPaths () {
    if (this.pageType === 'options') {
      return this.loadAllDisabledPaths()
    }

    if (!this.currentUrlSubject.value) {
      log.error('currentUrlSubject is null in refreshDisabledPaths')
      throw new Error('currentUrlSubject is null in refreshDisabledPaths')
    }

    this.updateDisabledPaths(this.currentUrlSubject.value)
  }


  private async updateResources (url: URL | null = null) {
    if (this.pageType === 'options') {
      return Promise.all([
        this.loadAllBindings(),
        this.loadAllDisabledPaths()
      ])
    }

    if (!url) {
      log.error('No url was provided to updateResources')
      throw new Error('No url was provided')
    }

    return Promise.all([
      this.updateBindings(url),
      this.updateDisabledPaths(url),
    ])
  }

  private async updateBindings (url: URL) {
    const bindings = await this.bindingsChannel.getBindingsForDomain(url.host)
    this.bindingsSubject.next(bindings)
  }

  private async updateDisabledPaths (url: URL) {
    const disabledPaths = await this.disabledPathsChannel.queryDisabledPaths(new Domain(url.host), Path.empty())
    this.disabledPathsSubject.next(disabledPaths)
  }

  private async loadAllBindings () {
    log.info('Loading all bindings')
    const bindings = await this.bindingsChannel.getAllBindings()
    this.bindingsSubject.next(bindings)
  }

  private async loadAllDisabledPaths () {
    log.info('Loading all disabled paths')
    const domain_paths = await this.disabledPathsChannel.getAllDisabledPaths()
    log.debug('domain_paths', domain_paths)
    this.disabledPathsSubject.next(domain_paths)
  }

  // ------------------------------------------

  getMatchingKey (event: KeyboardEvent): string | null {
    if (!isBindableKeydownEvent(event)) {
      return null
    }

    log.info(`Matching key pressed: "${event.key}"`)
    return event.key
  }

  async triggerBindingsByKey (key: string) {
    const matchingBindings = this.enabledBindings()?.filter(binding => binding.key === key) || []
    if (matchingBindings.length) {
      this.triggeredBinding.next(key)
    }
    return this.triggerBindings(matchingBindings)
  }

  async triggerBindings (bindings: Binding[]) {
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

  public async clickBinding (binding: Binding) {
    this.triggers.next(this._clickBinding_(binding))
  }

  private async _clickBinding_ (binding: Binding) {
    const element = await binding.getElement()
    if (element) {
      await sleep()
      element.focus()
      await this.click(element)
    } else {
      log.info('no element found for binding', binding)
      throw new InexistentElementError()
    }
  }

  async focusBinding (binding: Binding) {
    const element = await binding.getElement()
    if (element) {
      const overlay = highlightElement(element)
      overlay.id = bindingOverlayId(binding)
    }
  }

  async blurBinding (binding: Binding) {
    document
      .querySelectorAll('#' + bindingOverlayId(binding))
      .forEach((el) => el.remove())
  }

  async onKeyPress (e: KeyboardEvent) {
    const key = this.getMatchingKey(e)
    return key ? this.triggerBindingsByKey(key) : []
  }

  async togglePath (path: string) {
    log.info('Toggling path', path, this.currentSiteSplitted(), this.currentUrlSubject.value)
    const site = this.currentSiteSplitted()
    log.info('Site', site)
    if (!site?.domain) {
      log.error('No domain found')
      throw new Error('No domain found')
    }

    this.disabledPathsChannel.togglePath(site.domain, new Path(path))
  }
}
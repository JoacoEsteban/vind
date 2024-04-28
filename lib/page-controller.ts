import { Binding, bindingsAsMap } from '~lib/binding'
import { log } from './log'
import { BehaviorSubject, combineLatest, filter, lastValueFrom, map, merge } from 'rxjs'
import { Domain, Path, getSanitizedCurrentUrl } from './url'
import { BindingChannelImpl } from './messages/bindings'
import { isBindableKeydownEvent } from './element'
import { PageOverridesChannelImpl } from './messages/overrides'
import { PageOverrideInput, pageOverridesMap, type PageOverride } from './page-override'
import { expose } from './rxjs'
import { match } from 'ts-pattern'
import { sleep } from './control-flow'

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
    this.onEveryPageOverrideEvent$
      .subscribe(() => {
        log.info('PageOverride updated, refreshing overrides')
        this.refreshOverrides()
      })

    this.currentUrlSubject
      .subscribe((url) => {
        this.updateResources(url)
      })
  }

  public bindingsChannel = new BindingChannelImpl()
  public overridesChannel = new PageOverridesChannelImpl()

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
  private pageOverridesSubject: BehaviorSubject<PageOverride[]> = new BehaviorSubject<PageOverride[]>([])

  public onBindingRemoved$ = this.bindingsChannel.onBindingRemoved$
  public onBindingAdded$ = this.bindingsChannel.onBindingAdded$
  public onBindingUpdated$ = this.bindingsChannel.onBindingUpdated$

  public onEveryBindingEvent$ = merge(
    this.onBindingRemoved$,
    this.onBindingAdded$,
    this.onBindingUpdated$
  )

  public onPageOverrideRemoved$ = this.overridesChannel.onPageOverrideRemoved$
  public onPageOverrideAdded$ = this.overridesChannel.onPageOverrideAdded$
  public onPageOverrideUpdated$ = this.overridesChannel.onPageOverrideUpdated$

  public onEveryPageOverrideEvent$ = merge(
    this.onPageOverrideRemoved$,
    this.onPageOverrideAdded$,
    this.onPageOverrideUpdated$
  )

  public bindings$ = this.bindingsSubject.asObservable()
  public overrides$ = this.pageOverridesSubject.asObservable()

  public overridesSet$ = this.overrides$.pipe(
    map((overrides) =>
      new Set(overrides.map(override => override.bindingsPath.value))
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

  public overridesByPathMap$ = this.overrides$.pipe(
    map((overrides) =>
      pageOverridesMap(overrides)
    )
  )

  public displayBindings$ = combineLatest([this.currentDomainBindings$, this.currentSiteSplitted$]).pipe( // TODO buffer to prevent multiple updates
    map(([domainBindings, { path }]) => {

      const returns = {
        overlapping: new Map<Path['value'], Binding[]>(),
        nonOverlapping: new Map<Path['value'], Binding[]>(),
      }

      if (!path) {
        return returns
      }

      for (const [bindingPath, bindings] of domainBindings) {
        match(path.eitherIncludes(new Path(bindingPath)))
          .with(true, () =>
            returns.overlapping.set(bindingPath, bindings)
          )
          .with(false, () =>
            returns.nonOverlapping.set(bindingPath, bindings)
          )
          .exhaustive()
      }

      return returns
    })
  )

  public domainBindingsByNesting$ = combineLatest([this.currentDomainBindings$, this.currentSiteSplitted$]).pipe(
    map(([domainBindingsMap, { path }]) => {
      const currentPath = (path as Path).value

      const returns = {
        enclosing: new Map<Path['value'], Binding[]>(),
        branching: new Map<Path['value'], Binding[]>(),
      }

      for (const [domainPath, domainBindings] of domainBindingsMap) {
        let map = returns.branching

        if (currentPath.startsWith(domainPath)) {
          map = returns.enclosing
        }

        map.set(domainPath, domainBindings)
      }

      return returns
    })
  )

  public includedBindingPaths$ = combineLatest([this.domainBindingsByNesting$, this.overridesSet$])
    .pipe(
      filter(([domainBindingsMap]) => domainBindingsMap !== null),
      map(([domainBindingsMap, overrides]) => {
        const { enclosing, branching } = domainBindingsMap

        const includedPaths = new Set(enclosing.keys())

        for (const override of overrides) {
          if (enclosing.has(override)) {
            includedPaths.delete(override)
          } else if (branching.has(override)) { // TODO check if just `else` suffices
            includedPaths.add(override)
          }
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

  async refreshOverrides () {
    if (this.pageType === 'options') {
      return this.loadAllOverrides()
    }

    if (!this.currentUrlSubject.value) {
      log.error('currentUrlSubject is null in refreshOverrides')
      throw new Error('currentUrlSubject is null in refreshOverrides')
    }

    this.updateOverrides(this.currentUrlSubject.value)
  }


  private async updateResources (url: URL | null = null) {
    if (this.pageType === 'options') {
      return Promise.all([
        this.loadAllBindings(),
        this.loadAllOverrides()
      ])
    }

    if (!url) {
      log.error('No url was provided to updateResources')
      throw new Error('No url was provided')
    }

    return Promise.all([
      this.updateBindings(url),
      this.updateOverrides(url),
    ])
  }

  private async updateBindings (url: URL) {
    const bindings = await this.bindingsChannel.getBindingsForDomain(url.host)
    this.bindingsSubject.next(bindings)
  }

  private async updateOverrides (url: URL) {
    const overrides = await this.overridesChannel.getPageOverridesForSite(new Domain(url.host), new Path(url.pathname))
    this.pageOverridesSubject.next(overrides)
  }

  private async loadAllBindings () {
    log.info('Loading all bindings')
    const bindings = await this.bindingsChannel.getAllBindings()
    this.bindingsSubject.next(bindings)
  }

  private async loadAllOverrides () {
    log.info('Loading all overrides')
    const overrides = await this.overridesChannel.getAllPageOverrides()
    this.pageOverridesSubject.next(overrides)
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
      await sleep()
      element.focus()
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

  async togglePath (path: string) {
    log.info('Toggling path', path, this.currentSiteSplitted(), this.currentUrlSubject.value)
    const site = this.currentSiteSplitted()
    log.info('Site', site)
    if (!site?.domain) {
      log.error('No domain found')
      throw new Error('No domain found')
    }

    this.overridesChannel.togglePageOverride(new PageOverrideInput(site.domain, site.path || new Path(''), new Path(path)))
  }
}
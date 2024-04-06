import { getElementByXPath, getXPath } from './xpath'
import { Domain, Path, getCurrentUrl } from './url'
import { log } from './log'
import type { PageOverrideInsertType } from '~background/storage/db'

export class PageOverride {
  constructor(
    public readonly id: number,
    public readonly overridesDomain: Domain,
    public readonly overridesPath: Path,
    public readonly bindingsPath: Path,
  ) {}
}

export class PageOverrideInput {
  private readonly overrides_domain_path: string
  private readonly bindings_path: string

  constructor(
    overridesDomain: Domain,
    overridesPath: Path,
    bindingsPath: Path,
  ) {
    let [, domain_path] = overridesDomain.withPath(overridesPath).href.split('//')
    let bindings_path = bindingsPath.value

    if (!domain_path.endsWith('/')) {
      domain_path += '/'
    }
    if (!bindings_path.startsWith('/')) {
      bindings_path = '/' + bindings_path
    }

    this.overrides_domain_path = domain_path
    this.bindings_path = bindings_path

    log.info('PageOverrideInput', { overridesDomain, overridesPath, bindingsPath, domain_path })
  }

  getInput (): PageOverrideInsertType {
    return {
      overrides_domain_path: this.overrides_domain_path,
      bindings_path: this.bindings_path,
    }
  }
}

export function pageOverridesMap (overrides: PageOverride[]): Map<string, Map<number, string>> {
  const map = new Map<string, Map<number, string>>()

  overrides.forEach(override => {
    const domainPath = override.overridesDomain.withPath(override.overridesPath).href
    const bindingsPath = override.bindingsPath.value
    const paths = map.get(domainPath) || map.set(domainPath, new Map<number, string>()).get(domainPath)!

    paths.set(override.id, bindingsPath)
  })

  return map
}
export function pageOverridesSet (overrides: PageOverride[]): Set<string> {
  return new Set(overrides.map(override => override.bindingsPath.value))
}
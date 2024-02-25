import { append, get, getAll, getAsArray, removeFrom, update } from './storage'
import { nanoid } from 'nanoid'
import { getElementByXPath, getXPath } from './xpath'
import { addGlob, match, sanitizeUrl } from './url'

interface IBinding {
  id: string
  site: string
  key: string
  selector: string
}

export class Binding implements IBinding {
  id: string
  site: string
  key: string
  selector: string
  private element: HTMLElement | null = null

  constructor(site: string, key: string, selector: string, id?: string) {
    this.id = id || Binding.newId()
    this.site = addGlob(site)
    this.key = key
    this.selector = selector
  }

  static newId () {
    return Math.random().toString(36).substring(2)
  }
  static from (binding: IBinding) {
    return new Binding(binding.site, binding.key, binding.selector, binding.id)
  }

  static fromElement (element: HTMLElement, key: string) {
    const site = new URL(location.href)
    const selector = getXPath(element)
    const sanitized = sanitizeUrl(site)
    // console.log('sanitized', sanitized.href)

    const b = new Binding(sanitized.href, key, selector)
    // console.log('b', b)
    return b
  }

  async save () {
    await update('bindings', this, { upsert: true })
  }

  async remove () {
    await removeFrom('bindings', this.id)
  }

  getElement () {
    if (this.element && document.contains(this.element)) {
      return this.element
    }

    this.element = getElementByXPath(this.selector)

    return this.element || null
  }
}

export async function getBindings (): Promise<Binding[]> {
  const bindings = await getAsArray('bindings')
  return bindings.map(Binding.from)
}

export async function getBindingsAsUrlMap () {
  const bindings = await getBindings()
  return bindingsAsUrlMap(bindings)
}

export async function getBindingsForSite (site: URL): Promise<Binding[]> {
  const bindings = await getBindings()
  // console.log('site', site, bindings, site.href)
  return bindings.filter(binding => {
    // console.log('binding.site', binding.site, site.href, match(binding.site, site.href))
    // console.log('siteGlob', siteGlob, binding.site, match(binding.site, siteGlob))
    return match(binding.site, site)
  })
}

export async function getBindingsForSiteAsUrlMap (site: URL): Promise<Map<string, Binding[]>> {
  const bindings = await getBindingsForSite(site)
  return bindingsAsUrlMap(bindings)
}

function bindingsAsUrlMap (bindings: Binding[]): Map<string, Binding[]> {
  const map = new Map<string, Binding[]>()

  bindings.forEach(binding => {
    const site = binding.site
    const value = map.get(site) || map.set(site, []).get(site) as Binding[]
    value.push(binding)
  })

  return map
}

(async () => {
  const bindings = await getBindings()
  // for (const binding of bindings) {
  //   binding.site = binding.site.replace('/*', '{/**,}')
  //   await binding.save()
  // }
  console.log('bindings', bindings)
})()
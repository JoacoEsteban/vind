import { getAsArray, removeFrom, update } from './storage'
import { getElementByXPath, getXPath } from './xpath'
import { match, sanitizeHref, sanitizeUrl } from './url'
import { log } from './log'

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
    this.site = site
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

  getElement () {
    if (this.element && document.contains(this.element)) {
      return this.element
    }

    this.element = getElementByXPath(this.selector)

    return this.element || null
  }
}

export function bindingsAsUrlMap (bindings: Binding[]): Map<string, Binding[]> {
  const map = new Map<string, Binding[]>()

  bindings.forEach(binding => {
    const site = binding.site
    const value = map.get(site) || map.set(site, []).get(site) as Binding[]
    value.push(binding)
  })

  return map
}

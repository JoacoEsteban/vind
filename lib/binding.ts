import { append, get, getAll, getAsArray, removeFrom } from './storage'
import { minimatch as match } from 'minimatch'
import { nanoid } from 'nanoid'
import { getElementByXPath, getXPath } from './xpath'
import { sanitizeUrl } from './url'

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
    this.id = id || nanoid()
    this.site = site
    this.key = key
    this.selector = selector
  }

  static from (binding: IBinding) {
    return new Binding(binding.site, binding.key, binding.selector, binding.id)
  }

  static fromElement (element: HTMLElement, key: string) {
    const site = new URL(location.href)
    const selector = getXPath(element)

    return new Binding(sanitizeUrl(site).href, key, selector)
  }

  async save () {
    await append('bindings', this)
  }

  async remove () {
    await removeFrom('bindings', this.id)
  }

  async update () {
    await this.remove()
    await this.save()
  }

  getElement () {
    if (this.element) {
      return this.element
    }

    this.element = getElementByXPath(this.selector)

    return this.element
  }
}

export async function getBindings (): Promise<Binding[]> {
  const bindings = await getAsArray('bindings')
  return bindings.map(Binding.from)
}

export async function getBindingsForSite (site: URL): Promise<Binding[]> {
  const bindings = await getBindings()
  site = sanitizeUrl(site)
  return bindings.filter(binding => match(site.href, binding.site))
}

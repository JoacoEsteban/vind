import {
  getElementByXPath,
  buildXPathAndResolveToUniqueElement,
  getXPath,
  XPathObject,
  buildCompleteXPathObject,
} from './xpath'
import { Domain, Path, getCurrentUrl } from './url'
import { generateId } from './id'
import { match } from 'ts-pattern'
import { log } from './log'

export class Binding {
  private element: HTMLElement | null = null
  public readonly url: URL

  constructor(
    public readonly domain: Domain,
    public readonly path: Path,
    public readonly key: string,
    public readonly selector: string,
    public readonly xpathObject: XPathObject | null = null,
    public readonly id: string = Binding.newId(),
  ) {
    this.url = domain.withPath(path)
  }

  static newId() {
    return generateId()
  }
  static from(binding: Binding) {
    return new Binding(
      new Domain(binding.domain.value),
      new Path(binding.path.value),
      binding.key,
      binding.selector,
      binding.xpathObject,
      binding.id,
    )
  }

  static async fromElement(
    element: HTMLElement,
    key: string,
    domain: Domain,
    path: Path,
  ) {
    const res =
      (await buildXPathAndResolveToUniqueElement(element)).toOption() || []

    if (res.none) {
      throw new Error('Could not generate XPath for element')
    }

    const [xpathObject, selector] = res.val

    const b = new Binding(domain, path, key, selector, xpathObject)
    return b
  }

  async getElement() {
    if (this.element && document.contains(this.element)) {
      return this.element
    }

    this.element = await match(this.xpathObject)
      .with(null, () => getElementByXPath(this.selector))
      .otherwise(
        async (xpath) => (await xpath.resolveToUniqueElement())?.[1] || null,
      )

    return this.element || null
  }
}

export function bindingsAsMap(
  bindings: Binding[],
): Map<Domain['value'], Map<Path['value'], Binding[]>> {
  const map = new Map<Domain['value'], Map<Path['value'], Binding[]>>()

  bindings.forEach((binding) => {
    const domain = binding.domain.value
    const domMap = map.get(domain) || map.set(domain, new Map()).get(domain)!

    const path = binding.path.value
    const pathMap = domMap.get(path) || domMap.set(path, []).get(path)!

    pathMap.push(binding)
  })

  return map
}

import { RobulaPlus } from "px-robula-plus"
import { Err, Ok, Result } from "ts-results"
import { sleep, wrapResult } from './control-flow'
import { match } from 'ts-pattern'
import { NoUniqueXPathExpressionErrorForElement } from './error'
import { combinations, combinationsDescending, pairCombinations } from './generator'
import { log } from './log'
import type { SerializableXpathObject } from '~background/storage/db'
const robulaClient = new RobulaPlus()

export class XPathObject {
  constructor(
    public readonly tagName: string,
    public readonly attrs: XPathAttr[],
    public readonly parent: XPathObject | null = null,
    public readonly cacheResult: boolean = true,
  ) {}

  public async resolveToUniqueElement (childSelector?: string): Promise<[string, HTMLElement] | null> {
    const [iterations, res] = await this.resolveToUniqueElementInternal(childSelector)
    log.success('resolved to unique', { iterations, res })
    return res
  }

  private async resolveToUniqueElementInternal (childSelector?: string, level = 0, maxLevel = 5, iterations = 0): Promise<[number, [string, HTMLElement]] | [number, null]> {
    if (level > maxLevel) {
      return [iterations, null]
    }

    for (const attr of combinationsDescending(this.attrs)) {
      await sleep()
      iterations++

      const selector = joinXpath(this.tagName + attr.map(attr => attr.computed).join(''), childSelector)
      const absoluteSelector = toGlobal(selector)
      const results = evalXpath(absoluteSelector).unwrap()

      log.debug('resolving with attrs', { attr, iterations, results: results.length })

      if (results.length === 0) {
        continue
      }

      if (results.length === 1) { // unique
        const [el] = results
        return [iterations, [absoluteSelector, el]]
      }

      const [iterations_, fromParent] = await this.parent?.resolveToUniqueElementInternal(selector, level + 1, maxLevel, iterations) || [iterations, null]
      iterations = iterations_
      if (fromParent) {
        return [iterations, fromParent]
      }
    }

    log.debug('no unique found for ', { tagName: this.tagName, attrs: this.attrs, childSelector, depth: iterations })
    return [iterations, null]
  }

  public toSerializable (): SerializableXpathObject {
    return {
      tagName: this.tagName,
      attrs: this.attrs.map(attr => [attr.name, attr.value]),
      parent: this.parent?.toSerializable() || null,
    }
  }

  static fromSerializable (obj: SerializableXpathObject): XPathObject {
    console.log({ obj })
    return new XPathObject(
      obj.tagName,
      obj.attrs.map(([name, value]) => new XPathAttr(name, value)),
      obj.parent && XPathObject.fromSerializable(obj.parent)
    )
  }
}

export class XPathAttr {
  public readonly computed: string
  public readonly operator: 'equals' | 'contains'
  constructor(
    public readonly name: string,
    public readonly value: string[],
  ) {
    const operator = this.operator = match(name)
      .with('class', () => 'contains' as const)
      .otherwise(() => 'equals')

    name = match(name)
      .with('text', 'string', () => `${name}()`)
      .otherwise(() => `@${name}`)

    const expression = match(operator)
      .with('equals', () => `${name}='${value.join(' ')}'`)
      .with('contains', () => value.map(val => `contains(${name}, '${val}')`).join(' or '))
      .exhaustive()

    this.computed = `[${expression}]`
  }
}


export function isUnique (xpath: string): Result<boolean, Error>
export function isUnique (xpath: string, element: Element): Result<boolean, Error>
export function isUnique (xpath: string, element?: Element) {
  return wrapResult(() => {
    const [el, ...tail] = evalXpath(xpath).unwrap()

    if (element) {
      return el === element
    }

    return tail.length === 0
  })
}

export function evalXpath (xpath: string, node: Node = document) {
  return wrapResult(() => {
    const result = document.evaluate(xpath, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    const elements = []
    for (let i = 0; i < result.snapshotLength; i++) {
      const el = result.snapshotItem(i)
      el instanceof HTMLElement && elements.push(el)
    }
    return elements
  })
}

export function toGlobal (xpath: string) {
  return '//' + xpath
}

export function getXPath (element: Element): Result<string, Error> {
  return wrapResult(() => robulaClient.getRobustXPath(element, document))
}

export function getElementByXPath (xpath: string) {
  return robulaClient.getElementByXPath(xpath, document) as HTMLElement
}

export async function vindXPathStrategy (element: Element, parentElement?: Element | null): Promise<Result<string, Error>> {
  const res = buildCompleteXPathObject(element)

  if (res.ok) {
    const resolution = await res.val.resolveToUniqueElement()
    if (resolution) {
      const [selector, el] = resolution
      if (el !== element) {
        return Err(new Error('Element mismatch'))
      }
      return Ok(selector)
    }

    return Err(new NoUniqueXPathExpressionErrorForElement())
  }

  return res
}

export function buildCompleteXPathObject (element: Element): Result<XPathObject, Error> {
  const parentElement = element.parentElement
  const parentXpath = match(parentElement)
    .with(null, () => null)
    .otherwise(() => buildCompleteXPathObject(parentElement!))

  if (parentXpath?.err) {
    return Err(parentXpath.val)
  }

  const targetElement = element

  let tagName = targetElement.tagName.toLowerCase()

  const attrs = [
    'id',
    'name',
    'title',
    'aria-labelledby',
    'aria-label',
    // TODO position?
  ]
    .map<[string, string | null]>(attr => [attr, targetElement.getAttribute(attr)])
    .filter(([, val]) => {
      return val !== null
    })
    .map(([attr, val]) => new XPathAttr(attr, [val!]))

  const nodeText = getNodeText(targetElement)
  if (nodeText.length) {
    attrs.push(new XPathAttr('text', [nodeText]))
  } else if (targetElement.textContent?.length) {
    const text = targetElement.textContent
    if (text.length <= 20) {
      attrs.push(new XPathAttr('string', [text]))
    }
  }

  if (targetElement.classList.length) {
    const classes = [...targetElement.classList]
    attrs.push(new XPathAttr('class', classes))
  }

  const xpathObj = new XPathObject(tagName, attrs, parentXpath?.val)
  return Ok(xpathObj)
}

export function getNodeText (node: Node): string {
  const result = document.evaluate('text()', node, null, XPathResult.STRING_TYPE, null)
  return result.stringValue
}

export function joinXpath (parent: string, child?: string) {
  return child ? `${parent}/${child}` : parent
}
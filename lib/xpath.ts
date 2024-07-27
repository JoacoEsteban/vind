import { RobulaPlus } from "px-robula-plus"
import { Err, Ok, Result } from "ts-results"
import { sleep, wrapResult, wrapResultAsync } from './control-flow'
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


  public async resolveToUniqueElement (): Promise<[string, HTMLElement] | null> {
    const [iterations, res] = await this.resolveToUniqueElementDeep('')

    log.success('resolved to unique', { iterations }, ...(res || ['no unique found']))

    return res
  }

  public async benchmarkResolveToUniqueElement (): Promise<[string, HTMLElement] | null> {
    const [deep] = await Promise.all([
      this.resolveToUniqueElementDeep(''),
    ])

    const [iterations, res] = deep

    log.success('resolved to unique', deep[0])
    log.success(res)

    log.success('resolved to unique', { iterations }, ...(res || ['no unique found']))

    return res
  }

  private async resolveToUniqueElementDeep (childSelector?: string, level = 0, iterations = 0): Promise<[number, [string, HTMLElement]] | [number, null]> {

    let i = 0
    for (const attr of combinationsDescending(this.attrs)) {
      await sleep()
      iterations++
      const first = i++ === 0

      const selector = joinXpath(this.tagName + attr.map(attr => attr.computed).join(''), childSelector)
      const absoluteSelector = toGlobal(selector)
      const results = evalXpath(absoluteSelector).unwrap()

      log.debug('resolving with attrs', { attr, iterations, level, results: results.length })

      if (results.length === 0) {
        continue
      }

      if (results.length === 1) { // unique
        const [el] = results
        return [iterations, [absoluteSelector, el]]
      }

      const [iterations_, fromParent] = await this.parent?.resolveToUniqueElementDeep(selector, level + 1, iterations) || [iterations, null]
      iterations = iterations_
      if (fromParent) {
        return [iterations, fromParent]
      }

      if (first) { // TODO try to make this run for all, first should that combinationsDescending iterates from most specific to least specific every time
        log.debug('most specific has multiple matches, breaking')
        break
      }
    }

    log.debug('no unique found for ', { tagName: this.tagName, attrs: this.attrs, childSelector, iterations, level })
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
    return new XPathObject(
      obj.tagName,
      obj.attrs.map(([name, value]) => new XPathAttr(name, value)),
      obj.parent && XPathObject.fromSerializable(obj.parent)
    )
  }
}

export class XPathAttr {
  public readonly computed: string
  public readonly operator: 'equals' | 'contains' | 'starts-with'
  constructor(
    public readonly name: string,
    public readonly value: string[],
  ) {
    const operator = this.operator = match(name)
      .with('class', () => 'contains' as const)
      .with('href', () => 'starts-with' as const)
      .otherwise(() => 'equals')

    name = match(name)
      .with('text', 'string', () => `${name}()`)
      .otherwise(() => `@${name}`)

    const expression = match(operator)
      .with('equals', () => `${name}='${value.join(' ')}'`)
      .with('contains', 'starts-with', (op) => value.map(val => `${op}(${name}, '${val}')`).join(' or '))
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

  if (res.err) {
    log.error('failed to build xpath object', res.val)
    return res
  }

  const result = await wrapResultAsync(res.val.resolveToUniqueElement.bind(res.val))

  if (result.err) {
    log.error('failed to resolve to unique element', result.val)
    return Err(result.val)
  }

  const resolution = result.val

  if (!resolution) {
    log.error('no unique xpath expression found for element')
    return Err(new NoUniqueXPathExpressionErrorForElement())
  }

  const [selector, el] = resolution
  if (el !== element) {
    log.error('Element mismatch')
    return Err(new Error('Element mismatch'))
  }
  return Ok(selector)
}

export function buildCompleteXPathObject (element: Element): Result<XPathObject, Error> {
  const parentElement = element.parentElement
  const parentXpath = match(parentElement)
    .with(null, () => null)
    .otherwise(() => buildCompleteXPathObject(parentElement!))

  if (parentXpath?.err) {
    return Err(parentXpath.val)
  }

  const tagName = element.tagName.toLowerCase()
  const attrs = getAttributes(element)

  const xpathObj = new XPathObject(tagName, attrs, parentXpath?.val)
  return Ok(xpathObj)
}

export function getAttributes (targetElement: Element) {
  const attrs = [
    'id',
    'name',
    'title',
    'aria-labelledby',
    'aria-label',
    'href',
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
  return attrs
}

export function getNodeText (node: Node): string {
  const result = document.evaluate('text()', node, null, XPathResult.STRING_TYPE, null)
  return result.stringValue
}

export function joinXpath (parent: string, child?: string) {
  return child ? `${parent}/${child}` : parent
}
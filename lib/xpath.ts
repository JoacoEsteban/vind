import { RobulaPlus } from 'px-robula-plus'
import { Err, Ok, Result } from 'ts-results'
import { sleep, wrapResult, wrapResultAsync } from './control-flow'
import { match } from 'ts-pattern'
import { NoUniqueXPathExpressionErrorForElement } from './error'
import { combinationsDescending } from './generator'
import { log } from './log'
import type {
  SerializableChildXPathObject,
  SerializableParentXPathObject,
  SerializableXPathObject,
} from '~background/storage/db'
import { noop } from './misc'
const robulaClient = new RobulaPlus()

export class XPathObject {
  constructor(
    public readonly tagName: string,
    public readonly attrs: XPathAttr[],
    public readonly parent: ParentXPathObject | null = null,
    public readonly children: ChildXPathObject[] | null = null,
  ) {
    match(parent)
      .with(null, noop)
      .when((p) => p instanceof ParentXPathObject, noop)
      .otherwise(() => {
        throw new Error('parent must be null or instance of ParentXPathObject')
      })
    match(children)
      .with(null, noop)
      .when(
        (children) =>
          children.every((child) => child instanceof ChildXPathObject),
        noop,
      )
      .otherwise(() => {
        throw new Error('children must be null or array of ChildXPathObject')
      })
  }

  public async resolveToUniqueElement(): Promise<[string, HTMLElement] | null> {
    log.debug('resolving to unique', this)

    const [iterations, res] = await this.resolveToUniqueElementDeep('')

    log.success(
      'resolved to unique',
      { iterations },
      ...(res || ['no unique found']),
    )

    return res
  }

  public async benchmarkResolveToUniqueElement(): Promise<
    [string, HTMLElement] | null
  > {
    const [deep] = await Promise.all([this.resolveToUniqueElementDeep('')])

    const [iterations, res] = deep

    log.success('resolved to unique', deep[0])
    log.success(res)

    log.success(
      'resolved to unique',
      { iterations },
      ...(res || ['no unique found']),
    )

    return res
  }

  private async resolveToUniqueElementDeep(
    carrySelector?: string,
    direction: 'up' | 'down' = 'up',
    level = 0,
    iterations = 0,
  ): Promise<[number, [string, HTMLElement]] | [number, null]> {
    for (const {
      combination: attrCombination,
      lastOfSize,
    } of combinationsDescending(this.attrs)) {
      await sleep()
      iterations++

      const expression = this.xpathString(attrCombination)

      log.debug({ expression, direction, attrCombination, iterations, level })

      const selector = match(direction)
        .with('up', () => joinXpath(expression, carrySelector))
        .with('down', () => {
          if (!carrySelector) {
            throw new Error('carrySelector is required for down direction')
          }

          return joinXpath(carrySelector, expression, 'search')
        })
        .exhaustive()

      log.debug({ selector })

      const absoluteSelector = toGlobal(selector)
      const results = evalXpath(absoluteSelector).unwrap()

      log.debug('resolving with attrs', {
        direction,
        attr: attrCombination,
        iterations,
        level,
        results: results.length,
      })

      if (results.length === 0) {
        continue
      }

      if (results.length === 1) {
        // unique
        const [el] = results
        return [iterations, [absoluteSelector, el]]
      }

      const [parentIterations, fromParent] =
        (await this.parent?.resolveToUniqueElementDeep(
          selector,
          'up',
          level + 1,
          iterations,
        )) || [iterations, null]
      iterations = parentIterations
      if (fromParent) {
        log.info('found unique from parent')
        return [iterations, fromParent]
      }

      const [childIterations, fromChild] =
        (await this.children?.[0]?.resolveToUniqueElementDeep(
          selector,
          'down',
          level + 1,
          iterations,
        )) || [iterations, null]
      iterations = childIterations
      if (fromChild) {
        log.info('found unique from child')
        return [iterations, fromChild]
      }

      if (lastOfSize()) {
        // if most specific has multiple matches it means that all following combinations will also have multiple matches
        log.debug('most specific has multiple matches, breaking')
        break
      }
    }

    log.debug('no unique found for ', {
      tagName: this.tagName,
      attrs: this.attrs,
      childSelector: carrySelector,
      iterations,
      level,
    })
    return [iterations, null]
  }

  public xpathString(attrs: XPathAttr[]) {
    return this.tagName + attrs.map((attr) => attr.computed).join('')
  }

  public toSerializable(): SerializableXPathObject {
    return {
      tagName: this.tagName,
      attrs: this.attrs.map((attr) => [attr.name, attr.value]),
      parent: this.parent?.toSerializable() || null,
      children: this.children?.map((child) => child.toSerializable()) || null,
    }
  }

  static fromSerializable(obj: SerializableXPathObject): XPathObject {
    return new XPathObject(
      obj.tagName,
      obj.attrs.map(([name, value]) => new XPathAttr(name, value)),
      obj.parent && ParentXPathObject.fromSerializable(obj.parent),
      obj.children?.map((child) => ChildXPathObject.fromSerializable(child)),
    )
  }
}

export class ParentXPathObject extends XPathObject {
  override toSerializable(): SerializableParentXPathObject {
    return {
      tagName: this.tagName,
      attrs: this.attrs.map((attr) => [attr.name, attr.value]),
      parent: this.parent?.toSerializable() || null,
      children: null,
    }
  }

  static fromSerializable(
    obj: SerializableParentXPathObject,
  ): ParentXPathObject {
    return new ParentXPathObject(
      obj.tagName,
      obj.attrs.map(([name, value]) => new XPathAttr(name, value)),
      obj.parent && ParentXPathObject.fromSerializable(obj.parent),
      null,
    )
  }
}

export class ChildXPathObject extends XPathObject {
  override toSerializable(): SerializableChildXPathObject {
    return {
      tagName: this.tagName,
      attrs: this.attrs.map((attr) => [attr.name, attr.value]),
      parent: null,
      children: this.children?.map((child) => child.toSerializable()) || null,
    }
  }

  static fromSerializable(obj: SerializableChildXPathObject): ChildXPathObject {
    return new ChildXPathObject(
      obj.tagName,
      obj.attrs.map(([name, value]) => new XPathAttr(name, value)),
      null,
      obj.children?.map((child) => ChildXPathObject.fromSerializable(child)),
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
    const operator = (this.operator = match(name)
      .with('class', () => 'contains' as const)
      .with('href', () => 'starts-with' as const)
      .otherwise(() => 'equals'))

    name = match(name)
      .with('text', 'string', () => `${name}()`)
      .otherwise(() => `@${name}`)

    const expression = match(operator)
      .with('equals', () => `${name}='${value.join(' ')}'`)
      .with('contains', 'starts-with', (op) =>
        value.map((val) => `${op}(${name}, '${val}')`).join(' or '),
      )
      .exhaustive()

    this.computed = `[${expression}]`
  }
}

export function isUnique(xpath: string): Result<boolean, Error>
export function isUnique(
  xpath: string,
  element: Element,
): Result<boolean, Error>
export function isUnique(xpath: string, element?: Element) {
  return wrapResult(() => {
    const [el, ...tail] = evalXpath(xpath).unwrap()

    if (element) {
      return el === element
    }

    return tail.length === 0
  })
}

export function evalXpath(xpath: string, node: Node = document) {
  return wrapResult(() => {
    const result = document.evaluate(
      xpath,
      node,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    )
    const elements = []
    for (let i = 0; i < result.snapshotLength; i++) {
      const el = result.snapshotItem(i)
      el instanceof HTMLElement && elements.push(el)
    }
    return elements
  })
}

export function toGlobal(xpath: string) {
  return '//' + xpath
}

export function getXPath(element: Element): Result<string, Error> {
  return wrapResult(() => robulaClient.getRobustXPath(element, document))
}

export function getElementByXPath(xpath: string) {
  return robulaClient.getElementByXPath(xpath, document) as HTMLElement
}

export async function buildXPathAndResolveToUniqueElement(
  element: Element,
): Promise<Result<[XPathObject, string], Error>> {
  const completeXPathResult = buildCompleteXPathObject(element)

  if (completeXPathResult.err) {
    return Err(completeXPathResult.val)
  }

  const completeXPath = completeXPathResult.val

  log.debug(
    'built complete xpath object',
    completeXPath,
    completeXPath.toSerializable(),
  )

  const result = await wrapResultAsync(
    completeXPath.resolveToUniqueElement.bind(completeXPath),
  )

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

  return Ok([completeXPath, selector])
}

export function buildCompleteXPathObject(element: Element) {
  const xpathWithParents = buildCompleteXPathObjectWithParents(element)
  if (xpathWithParents.err) {
    log.error('failed to build xpath object with parent', xpathWithParents.val)
    return xpathWithParents
  }
  const xpathWithChildren = buildXPathObjectWithOnlyChild(element)
  if (xpathWithChildren.err) {
    log.error(
      'failed to build xpath object with only child',
      xpathWithChildren.val,
    )
    return xpathWithChildren
  }
  return wrapResult(
    () =>
      new XPathObject(
        xpathWithParents.val.tagName,
        xpathWithParents.val.attrs,
        xpathWithParents.val.parent,
        xpathWithChildren.val.children,
      ),
  )
}

function buildCompleteXPathObjectWithParents(
  element: Element,
  base?: true,
): Result<XPathObject, Error>
function buildCompleteXPathObjectWithParents(
  element: Element,
  base?: false,
): Result<ParentXPathObject, Error>
function buildCompleteXPathObjectWithParents(element: Element, base = true) {
  const parentElement = element.parentElement
  const parentXpath = match(parentElement)
    .with(null, () => null)
    .otherwise(() => buildCompleteXPathObjectWithParents(parentElement!, false))

  if (parentXpath?.err) {
    return Err(parentXpath.val)
  }

  const tagName = element.tagName.toLowerCase()
  const attrs = getAttributes(element)

  return wrapResult(() =>
    match(base)
      .with(true, () => new XPathObject(tagName, attrs, parentXpath?.val))
      .with(
        false,
        () => new ParentXPathObject(tagName, attrs, parentXpath?.val),
      )
      .exhaustive(),
  )
}

function buildXPathObjectWithOnlyChild(
  element: Element,
  base?: true,
): Result<XPathObject, Error>
function buildXPathObjectWithOnlyChild(
  element: Element,
  base?: false,
): Result<ChildXPathObject, Error>
function buildXPathObjectWithOnlyChild(element: Element, base = true) {
  const childXPath = match(element.childElementCount)
    .with(1, () =>
      buildXPathObjectWithOnlyChild(element.firstElementChild!, false),
    )
    .otherwise(() => null)

  if (childXPath?.err) {
    return Err(childXPath.val)
  }

  const tagName = element.tagName.toLowerCase()
  const attrs = getAttributes(element)

  const children = match(childXPath)
    .with(null, () => null)
    .otherwise((child) => [child.val])

  return wrapResult(() =>
    match(base)
      .with(true, () => new XPathObject(tagName, attrs, null, children))
      .with(false, () => new ChildXPathObject(tagName, attrs, null, children))
      .exhaustive(),
  )
}

export function getAttributes(targetElement: Element) {
  const attrs = [
    'id',
    'name',
    'title',
    'aria-labelledby',
    'aria-label',
    'href',
    'alt',
    // TODO position?
  ]
    .map<[string, string | null]>((attr) => [
      attr,
      targetElement.getAttribute(attr),
    ])
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

export function getNodeText(node: Node): string {
  const result = document.evaluate(
    'text()',
    node,
    null,
    XPathResult.STRING_TYPE,
    null,
  )
  return result.stringValue
}

export function joinXpath(
  parent: string,
  child?: string,
  behavior: 'locate' | 'search' = 'locate',
) {
  return match(Boolean(child))
    .with(false, () => parent)
    .otherwise(() => {
      const childExpression = match(behavior)
        .with('locate', () => `/${child}`)
        .with('search', () => `[${child}]`)
        .exhaustive()

      return `${parent}${childExpression}`
    })
}

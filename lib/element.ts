import { pEvent, type CancelablePromise, type Emitter } from 'p-event'
import { noop } from './misc'
import type { Binding } from './binding'
import { Observable, Subject } from 'rxjs'
import type { VoidSubject } from './rxjs'

export type KeyDownEmitter = Emitter<string, [KeyboardEvent]>

export const unBindableKeys = new Set([
  'TAB',
  'ENTER',
  'ESCAPE',
  'SHIFT',
  'CONTROL',
  'ALT',
  'META',
])

export const mousedownEvent = new MouseEvent('mousedown', {
  bubbles: true,
  cancelable: false,
  composed: true,
})

export const mouseupEvent = new MouseEvent('mouseup', {
  bubbles: true,
  cancelable: false,
  composed: true,
})

export const clickEvent = new MouseEvent('click', {
  bubbles: true,
  cancelable: false,
  composed: true,
})

export function getClosestBindableElement(
  element: HTMLElement,
): HTMLElement | null {
  const closest = element.closest<HTMLElement>(
    'button, input, a, div, [role="button"]',
  )
  return closest && isHighlightableElement(closest) ? closest : null
}

export async function waitForKey(
  key: string,
  signal?: AbortSignal,
): Promise<void> {
  await pEvent<string, KeyboardEvent>(document, 'keydown', {
    signal,
    filter: (e) => e.key === key,
  }).catch(noop)
}

export function recordInputKey(signal?: AbortSignal): Promise<string> {
  return pEvent<string, KeyboardEvent>(document, 'keydown', {
    signal,
    filter: (e) => isBindableKeydownEvent(e),
  }).then((e) => {
    if (!e.key) {
      throw new Error('Missing key in event')
    }

    return e.key
  })
}

export function isBindableKeyboardEvent(event: KeyboardEvent): boolean {
  return event.type === 'keydown' && isBindableKeydownEvent(event)
}

export function isBindableKeydownEvent(event: KeyboardEvent): boolean {
  return !(isProtectedKeydownEvent(event.target) || isUnBindableKey(event.key))
}

export function isProtectedKeydownEvent(element: EventTarget | null): boolean {
  if (!element) return false
  if (!(element instanceof HTMLElement)) return false

  return [
    (element: HTMLElement) => element instanceof HTMLInputElement,
    (element: HTMLElement) => element instanceof HTMLTextAreaElement,
    (element: HTMLElement) => element.contentEditable === 'true',
  ].some((fn) => fn(element))
}

export function isUnBindableKey(key: string): boolean {
  return unBindableKeys.has(key.toUpperCase())
}

export function waitForKeyDown(
  key: string,
  signal?: AbortSignal,
  emitter: KeyDownEmitter = document,
): CancelablePromise<KeyboardEvent> {
  return pEvent<'keydown', KeyboardEvent>(emitter, 'keydown', {
    signal,
    filter: (e) => e.key === key,
  })
}

export function isHighlightableElement(el: HTMLElement) {
  return !(
    el.nodeName === 'PLASMO-CSUI' ||
    ['vind-ignore-self'].some((className) =>
      el.classList.contains(className),
    ) ||
    el.closest('.vind-ignore-\\*') !== null ||
    el.id === '__plasmo'
  )
}

export function isConfirmableElement(e: MouseEvent) {
  return document
    .elementsFromPoint(e.clientX, e.clientY)
    .some((el) => el.classList.contains('vind-overlay'))
}

export function bindingOverlayId(binding: Binding) {
  return `overlay-${binding.id}`
}

function getStyle(element: HTMLElement, property: string) {
  return getComputedStyle(element).getPropertyValue(property)
}

export function observeStylePropertyAndParents(
  element: HTMLElement,
  property: string,
  callback: (args: {
    element: HTMLElement
    lastComputedStyle: string
    newComputedStyle: string
  }) => void,
) {
  const prevStyles: Map<HTMLElement, string> = new Map()

  const observer = new MutationObserver((records) => {
    const [record] = records
    const element = record.target
    if (!(element instanceof HTMLElement)) return

    const newComputedStyle = getStyle(element, property)
    const lastComputedStyle = prevStyles.get(element)

    if (
      lastComputedStyle !== undefined &&
      lastComputedStyle !== newComputedStyle
    ) {
      prevStyles.set(element, newComputedStyle)
      callback({ element, lastComputedStyle, newComputedStyle })
    }
  })

  let currentElement = element as HTMLElement | null
  while (currentElement) {
    prevStyles.set(currentElement, getStyle(currentElement, property))

    observer.observe(currentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'], // Watch for relevant attribute changes
      childList: false,
      subtree: false,
    })

    currentElement = currentElement.parentElement // Move to the parent element
  }
}

export class StylePropertyAndParentsObserver extends Observable<{
  element: HTMLElement
  lastComputedStyle: string
  newComputedStyle: string
}> {
  constructor(element: HTMLElement, property: string) {
    super()
    const sub = new Subject<{
      element: HTMLElement
      lastComputedStyle: string
      newComputedStyle: string
    }>()
    observeStylePropertyAndParents(element, property, (args) => {
      sub.next(args)
    })
    return sub.asObservable()
  }
}

export class GlobalDisconnectionObserver {
  private observer = new MutationObserver(this.handle.bind(this))

  constructor(private readonly ownerDocument = document) {}

  private listening = new Map<Node, VoidSubject>()

  get observing() {
    return this.listening.size > 0
  }

  private handle(records: MutationRecord[]) {
    for (const list of records.flatMap((rec) => rec.removedNodes.values())) {
      for (const node of list) {
        this.handleNode(node)
      }
    }
  }

  private handleNode(node: Node) {
    const subject = this.listening.get(node)

    if (subject) {
      subject.next()
      subject.complete()
      this.listening.delete(node)
    }

    if (this.collect()) {
      return
    }

    node.childNodes.forEach((child) => this.handleNode(child))
  }

  observe(target: Node) {
    if (!this.observing) {
      this.observer.observe(this.ownerDocument, {
        childList: true,
        subtree: true,
      })
    }

    const subject = new Subject<void>()
    this.listening.set(target, subject)

    return subject.asObservable()
  }

  disconnect(target: Node): void {
    this.listening.get(target)?.complete()
    this.listening.delete(target)
    this.collect()
  }

  collect() {
    if (this.listening.size === 0) {
      this.observer.disconnect()
      return true
    }
    return false
  }
}

export const onElementDisconnected = ((observer) => (node: Node) => ({
  onDisconnected$: observer.observe(node),
  cancel: () => observer.disconnect(node),
}))(new GlobalDisconnectionObserver())

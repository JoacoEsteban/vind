import { pEvent, type CancelablePromise, type Emitter } from 'p-event'
import { noop } from './misc'
import type { Binding } from './binding'
import { Observable, Subject } from 'rxjs'

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

export function addClickTargetToElement(element: HTMLElement) {
  const overlay = document.createElement('div')

  const boundingRect = element.getBoundingClientRect()

  overlay.style.position = 'fixed'
  overlay.style.top = `${boundingRect.top}px`
  overlay.style.left = `${boundingRect.left}px`
  overlay.style.width = `${boundingRect.width}px`
  overlay.style.height = `${boundingRect.height}px`

  overlay.style.zIndex = '999999999'
  overlay.style.borderRadius = getComputedStyle(element).borderRadius

  overlay.classList.add('vind-overlay')
  overlay.classList.add('vind-ignore-*')

  document.body.appendChild(overlay)
  return overlay
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

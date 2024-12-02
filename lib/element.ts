import { pEvent, type CancelablePromise } from 'p-event'
import { noop } from './misc'
import type { Binding } from './binding'

export const unBindableKeys = new Set([
  'TAB',
  'ENTER',
  'ESCAPE',
  'SHIFT',
  'CONTROL',
  'ALT',
  'META',
])

export function isBindableElement(element: HTMLElement): boolean {
  // filter if not type button or input or a
  return (
    element.role === 'button' ||
    ['button', 'input', 'a'].includes(element.tagName.toLowerCase())
  )
}

export function getClosestBindableElement(
  element: HTMLElement,
): HTMLElement | null {
  return element.closest('button, input, a, div, [role="button"]')
}

export function highlightElement(element: HTMLElement) {
  const overlay = document.createElement('div')
  const boundingRect = element.getBoundingClientRect()

  overlay.style.position = 'fixed'
  overlay.style.top = `${boundingRect.top}px`
  overlay.style.left = `${boundingRect.left}px`
  overlay.style.width = `${boundingRect.width}px`
  overlay.style.height = `${boundingRect.height}px`

  overlay.style.border = '2px solid #00ff00'
  overlay.style.background = '#00ff0010'
  overlay.style.zIndex = '999999999'
  overlay.style.borderRadius = '4px'

  overlay.classList.add('vind-overlay')
  overlay.classList.add('vind-ignore')

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
): CancelablePromise<KeyboardEvent> {
  return pEvent<string, KeyboardEvent>(document, 'keydown', {
    signal,
    filter: (e) => e.key === key,
  })
}

export function isHighlightableElement(el: HTMLElement) {
  return el.nodeName !== 'PLASMO-CSUI' && !el.classList.contains('vind-ignore')
}

export function isConfirmableElement(e: MouseEvent) {
  return document
    .elementsFromPoint(e.clientX, e.clientY)
    .some((el) => el.classList.contains('vind-overlay'))
}

export function bindingOverlayId(binding: Binding) {
  return `overlay-${binding.id}`
}

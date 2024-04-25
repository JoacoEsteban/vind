import { pEvent, type CancelablePromise } from 'p-event'
import { PromiseWithResolvers } from './polyfills'

export const unBindableKeys = new Set(['TAB', 'ENTER', 'ESCAPE', 'SHIFT', 'CONTROL', 'ALT', 'META'])

export function isBindableElement (element: HTMLElement): boolean {
  // filter if not type button or input or a
  return ['button', 'input', 'a', 'div'].includes(element.tagName.toLowerCase())
}

export function highlightElement (element: HTMLElement) {
  element.style.outline = '2px solid #ff0000'
}

export function unhighlightElement (element: HTMLElement) {
  element.style.outline = ''
}

export function waitForElementLeave (element: HTMLElement) {
  return pEvent(element, 'mouseleave')
}

export function highlightElementUntilLeave (element: HTMLElement) {
  highlightElement(element)
  const { resolve, promise: cancelPromise } = PromiseWithResolvers<void>()

  const promise = Promise.race([
    waitForElementLeave(element),
    cancelPromise
  ]).then(() => unhighlightElement(element))

  return {
    promise,
    cancel: resolve
  }
}

export function recordInputKey (signal?: AbortSignal): Promise<string> {
  return pEvent<string, KeyboardEvent>(document, 'keydown', {
    signal,
    filter: (e) => isBindableKeydownEvent(e)
  })
    .then((e) => {
      if (!e.key) {
        throw new Error('Missing key in event')
      }

      return e.key
    })
}

export function isBindableKeydownEvent (event: KeyboardEvent): boolean {
  return !(
    isProtectedKeydownEvent(event.target) ||
    isUnBindableKey(event.key)
  )
}

export function isProtectedKeydownEvent (element: EventTarget | null): boolean {
  if (!element) return false
  if (!(element instanceof HTMLElement)) return false

  return [
    (element: HTMLElement) => element instanceof HTMLInputElement,
    (element: HTMLElement) => element instanceof HTMLTextAreaElement,
    (element: HTMLElement) => element.contentEditable === 'true',
  ]
    .some(fn => fn(element))
}

export function isUnBindableKey (key: string): boolean {
  return unBindableKeys.has(key.toUpperCase())
}

export function waitForKeyDown (key: string, signal?: AbortSignal): CancelablePromise<KeyboardEvent> {
  return pEvent<string, KeyboardEvent>(document, 'keydown', {
    signal,
    filter: (e) => e.key === key
  })
}
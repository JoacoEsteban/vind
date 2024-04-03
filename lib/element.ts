import { pEvent } from 'p-event'
import { PromiseWithResolvers } from './polyfills'

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

export async function recordInputKey (): Promise<string> {
  console.log('recordInputKey')
  const { key } = await pEvent<string, KeyboardEvent>(document, 'keydown', {
    filter: (e) => {
      return !(
        isProtectedKeydownEvent(e.target) ||
        ['TAB', 'ENTER', 'ESCAPE', 'SHIFT', 'CONTROL', 'ALT', 'META'].includes(e.key.toUpperCase())
      )
    }
  })

  return key
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
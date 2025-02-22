import type { BrowserClickedEvent } from '~test/types'

export async function openOverlay() {
  ;(chrome.action.onClicked as unknown as BrowserClickedEvent).dispatch() // TODO make TS infer this type
}

export interface BrowserClickedEvent {
  dispatch: () => void
}

export declare namespace chrome.action {
  interface onClicked extends BrowserClickedEvent {}
}

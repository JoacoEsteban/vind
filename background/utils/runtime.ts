declare global {
  namespace browser {
    const runtime: typeof chrome.runtime
    const tabs: typeof chrome.tabs
  }
}

const extTabs = (globalThis.browser?.tabs ||
  globalThis.chrome?.tabs) as typeof chrome.tabs

export function interopRuntime () {
  const extRuntime = (globalThis.browser?.runtime ||
    globalThis.chrome?.runtime) as typeof chrome.runtime

  if (!extRuntime) {
    throw new Error("Extension runtime is not available")
  }
  return extRuntime
}

export function interopTabs () {
  if (!extTabs) {
    throw new Error("Extension tabs API is not available")
  }
  return extTabs
}

export function interopAction () {
  return chrome.action || chrome.browserAction
}

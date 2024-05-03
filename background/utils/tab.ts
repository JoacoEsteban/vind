import { interopTabs } from './runtime'

const tabs = interopTabs()

export async function getActiveTab () {
  const [tab] = await tabs.query({ active: true, currentWindow: true })
  return tab
}

export async function getAllTabs () {
  return await tabs.query({})
}

export async function getActiveTabId () {
  const tab = await getActiveTab()
  return tab?.id || null
}
export async function getAssertedActiveTabId () {
  const tab = await getActiveTab()
  if (!tab.id) throw new Error('No active tab')
  return tab.id
}

export async function sendToAllTabs<T> (sender: (tabId: number) => Promise<T>) { // TODO deprecate?
  const tabs = await getAllTabs()
  return Promise.all(tabs.filter((tab) => tab.id !== undefined).map(tab => sender(tab.id!)))
}

export async function sendToActiveTab<T> (sender: (tabId: number) => Promise<T>) {
  return sender(await getAssertedActiveTabId())
}
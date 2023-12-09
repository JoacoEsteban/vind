export async function getActiveTab () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

export async function getActiveTabId () {
  const tab = await getActiveTab()
  return tab?.id || null
}
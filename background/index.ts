import { askForBinding, askForBindingStream, askForOptionsPageStream } from '~/messages'
import { getActiveTabId, getAssertedActiveTabId } from './utils/tab'
import { showOverlay, wakeUp } from '~messages/tabs'
import { VindDB } from './storage/db'
import { BindingsStorageImpl } from './storage/bindings-storage'
import { PageOverridesStorageImpl } from './storage/page-overrides-storage'
import { bindingsMessages } from '~messages/storage'
import { log } from '~lib/log'
import { StorageHandlers } from './handlers'

const db = new VindDB()
export const bindingsStorage = new BindingsStorageImpl(db)
export const pageOverridesStorage = new PageOverridesStorageImpl(db)

new StorageHandlers(bindingsStorage, pageOverridesStorage).init()

chrome.tabs.onActivated.addListener(activeInfo => {
  wakeUp.ask.toTab({
    tabId: activeInfo.tabId
  })
})

askForBindingStream.subscribe(async ([, sender]) => {
  const tabId = await getActiveTabId()
  if (!tabId) return
  askForBinding.toTab({
    tabId: tabId
  })
})

askForOptionsPageStream.subscribe(async ([, sender]) => {
  chrome.runtime.openOptionsPage()
})

chrome.action.onClicked.addListener(async (tab) => {
  log.info('Action clicked')
  const tabId = await getActiveTabId()
  if (!tabId) return
  showOverlay.toTab({
    tabId: tabId
  })
})
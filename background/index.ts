import { askForOptionsPageStream, newBinding } from '~/messages'
import { getActiveTabId, openTab, sendToActiveTab } from './utils/tab'
import { showOverlay, wakeUp } from '~messages/tabs'
import { VindDB } from './storage/db'
import { BindingsStorageImpl } from './storage/bindings-storage'
import { DisabledBindingPathsStorageImpl } from './storage/disabled-paths-storage'
import { bindingsMessages } from '~messages/storage'
import { log } from '~lib/log'
import { StorageHandlers } from './handlers'
import { match } from 'ts-pattern'
import { interopAction, interopRuntime, interopTabs } from './utils/runtime'
import { EventHandlers } from './handlers/events'

const db = new VindDB()
export const bindingsStorage = new BindingsStorageImpl(db)
export const disabledBindingPathsStorage = new DisabledBindingPathsStorageImpl(
  db,
)

new StorageHandlers(bindingsStorage, disabledBindingPathsStorage).init()
new EventHandlers().init()

const tabs = interopTabs()
const runtime = interopRuntime()
const action = interopAction()

runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    openTab('getting-started')
  }
})

async function sendShowOverlay() {
  const tabId = await getActiveTabId()
  if (!tabId) return
  showOverlay.toTab({
    tabId: tabId,
  })
}

function openOptionsPage() {
  runtime.openOptionsPage()
}

function sendNewBinding() {
  sendToActiveTab(async (tabId) => {
    newBinding.ask.toTab({
      tabId: tabId,
    })
  })
}

tabs.onActivated.addListener((activeInfo) => {
  wakeUp.ask.toTab({
    tabId: activeInfo.tabId,
  })
})

askForOptionsPageStream.subscribe(openOptionsPage)

chrome.commands.onCommand.addListener(async (command) => {
  log.info('Command received', command)
  match(command)
    .with('toggle-overlay', sendShowOverlay)
    .with('open-options', openOptionsPage)
    .with('new-binding', sendNewBinding)
    .otherwise(() => {
      log.warn('No matching command found for', `"${command}"`)
    })
})

action.onClicked.addListener(async function onAction() {
  log.info('Action clicked')
  sendShowOverlay()
})

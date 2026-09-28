import { match } from 'ts-pattern'
import { defineBackground } from 'wxt/utils/define-background'
import { StorageHandlers } from '~/background/handlers'
import { EventHandlers } from '~/background/handlers/events'
import { BindingsStorageImpl } from '~/background/storage/bindings-storage'
import { VindDB } from '~/background/storage/db'
import { DisabledBindingPathsStorageImpl } from '~/background/storage/disabled-paths-storage'
import { NotificationSettingsStorageImpl } from '~/background/storage/notification-settings-storage'
import {
  interopAction,
  interopRuntime,
  interopTabs,
} from '~/background/utils/runtime'
import {
  getActiveTabId,
  openTab,
  sendToActiveTab,
} from '~/background/utils/tab'
import { log } from '~/lib/log'
import { askForOptionsPageStream, newBinding } from '~/messages'
import { showOverlay, wakeUp } from '~/messages/tabs'

export default defineBackground(() => {
  const db = new VindDB()

  new StorageHandlers(
    new BindingsStorageImpl(db),
    new DisabledBindingPathsStorageImpl(db),
    new NotificationSettingsStorageImpl(db),
  ).init()
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
})

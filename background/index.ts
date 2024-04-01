import { askForBinding, askForBindingStream, askForOptionsPageStream } from '~/messages'
import { getActiveTabId, getAssertedActiveTabId } from './utils/tab'
import { showOverlay, wakeUp } from '~messages/tabs'
import { VindDB } from './storage/db'
import { BindingsStorageImpl } from './storage/bindings-storage'
import { storage } from '~messages/storage'
import { log } from '~lib/log'

const db = new VindDB()
export const bindingsStorage = new BindingsStorageImpl(db)

storage.getAllBindings.stream.subscribe(async ([, sender, respond]) => {
  const bindings = await bindingsStorage.getAllBindings()
  respond(bindings)
})

storage.getBindingsForSite.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
  const bindings = await bindingsStorage.getBindingsForSite(domain, path)
  respond(bindings)
})

storage.getBindingsForDomain.stream.subscribe(async ([domain, sender, respond]) => {
  const bindings = await bindingsStorage.getBindingsForDomain(domain)
  respond(bindings)
})

storage.addBinding.stream.subscribe(async ([binding, sender]) => {
  await bindingsStorage.addBinding(binding)
})

storage.updateBinding.stream.subscribe(async ([binding, sender]) => {
  await bindingsStorage.updateBinding(binding)
})

storage.removeBinding.stream.subscribe(async ([id, sender]) => {
  await bindingsStorage.removeBinding(id)
})

bindingsStorage.onAdded$.subscribe(async (binding) => {
  log.info('onAdded from background index', binding)
  storage.onBindingAdded.ask(binding, {
    tabId: await getAssertedActiveTabId()
  })
})

bindingsStorage.onUpdated$.subscribe(async (binding) => {
  log.info('onUpdated from background index', binding)
  storage.onBindingUpdated.ask(binding, {
    tabId: await getAssertedActiveTabId()
  })
})

bindingsStorage.onDeleted$.subscribe(async (binding) => {
  log.info('onDeleted from background index', binding)
  storage.onBindingRemoved.ask(binding, {
    tabId: await getAssertedActiveTabId()
  })
})

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
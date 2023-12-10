import { get, set } from '~lib/storage'
import { askForBinding, askForBindingStream } from '~/messages'
import { getActiveTab, getActiveTabId } from './utils/tab'
import { getCurrentUrlStream } from '~messages/tabs'


async function sanitizeStorage () {
  const bindings = await get('bindings')
  if (typeof bindings === 'undefined') {
    await set('bindings', [])
  }

  console.log('Initial storage', await get('bindings'))
}

(async function init () {
  await sanitizeStorage()
})()


askForBindingStream.subscribe(async ([, sender]) => {
  askForBinding.toTab({
    tabId: await getActiveTabId() || 12
  })
})

getCurrentUrlStream.subscribe(async ([, sender, respond]) => {
  const currentTab = await getActiveTab()
  respond(currentTab?.url || null)
})
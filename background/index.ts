import { get, set } from '~lib/storage'
import { askForBinding, askForBindingStream } from '~/messages'
import { getActiveTabId } from './utils/tab'


async function sanitizeStorage () {
  const bindings = await get('bindings')
  if (typeof bindings === 'undefined') {
    await set('bindings', [])
  }
}

(async function init () {
  await sanitizeStorage()
})()


askForBindingStream.subscribe(async ([, sender]) => {
  askForBinding.toTab({
    tabId: await getActiveTabId() || 12
  })
})

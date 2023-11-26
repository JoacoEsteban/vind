import { get, set } from '~lib/storage'

async function sanitizeStorage () {
  const bindings = await get('bindings')
  if (typeof bindings === 'undefined') {
    await set('bindings', [])
  }
}

async function init () {
  await sanitizeStorage()
}

init()
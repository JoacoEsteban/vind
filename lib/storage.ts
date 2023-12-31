import { Storage, type StorageWatchCallback } from '@plasmohq/storage'
import assert from 'assert'

type WithId<T> = T & { id: string }

const storage = new Storage({ area: 'local' })

export async function get (key: string) {
  return storage.get(key)
}

export async function getAsArray (key: string) {
  const value = await get(key)
  assert(Array.isArray(value), 'value is not an array')
  return value
}

export async function getAll () {
  return storage.getAll()
}

export async function set (key: string, value: any) {
  if (typeof value === 'undefined')
    throw new Error('value is undefined')

  await storage.set(key, value)
}

export async function append<T> (key: string, value: WithId<T>) {
  assert(typeof key === 'string')
  assert(typeof value !== 'undefined')
  assert(value.id)

  const existing = await get(key)

  if (typeof existing === 'undefined') {
    await set(key, [value])
  } else {
    await set(key, [...existing, value])
  }
}

export async function prepend<T> (key: string, value: WithId<T>) {
  assert(typeof key === 'string')
  assert(typeof value !== 'undefined')
  assert(value.id)

  const existing = await get(key)

  if (typeof existing === 'undefined') {
    await set(key, [value])
  } else {
    await set(key, [value, ...existing])
  }
}

export async function removeFrom (key: string, id: string) {
  assert(typeof key === 'string')
  assert(typeof id === 'string')

  const existing = await getAsArray(key)

  if (typeof existing === 'undefined') {
    return
  } else {
    await set(key, existing.filter(item => item.id !== id))
  }
}


// ------------------------------------------

export async function remove (key: string) {
  await storage.remove(key)
}

export async function clear () {
  await storage.clear()
}


export function on (key: string, callback: StorageWatchCallback) {
  storage.watch({
    [key]: callback
  })

  return () => {
    off(key, callback)
  }
}

export function off (key: string, callback: StorageWatchCallback) {
  storage.unwatch({
    [key]: callback
  })
}
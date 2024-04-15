import { log } from './log'

export function eventCoupler (cb: (event: KeyboardEvent) => void, delay = 100) {
  let lastKey = ''
  let lastKeyTime = 0

  return (event: KeyboardEvent) => {
    log.info('Key press', event.type, event.key)
    const key = event.key
    const time = Date.now()

    if (key === lastKey && time - lastKeyTime < delay) {
      log.warn('Ignoring key press, too fast')
      return
    }

    cb(event)
    lastKey = key
    lastKeyTime = time
  }
}

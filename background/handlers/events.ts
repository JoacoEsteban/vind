import { match, P } from 'ts-pattern'
import { log } from '~lib/log'
import { noop } from '~lib/misc'
import { forwardKeyEvent } from '~messages/tabs'

export class EventHandlers {
  constructor() {}

  init() {
    forwardKeyEvent.stream.subscribe(([event, { tab, frameId }]) => {
      match([tab?.id, frameId])
        .with([P.number, P.number], ([tabId]) => {
          forwardKeyEvent.ask(event, {
            tabId,
            // intentionally ignore frameId in order to send to root
          })
        })
        .with([P.number, undefined], ([tabId]) => {
          log.warn(
            'Got a request to forward a keyboard event from a root page, only iFrames should forward events.',
            { tabId },
          )
        })
        .otherwise(([tabId, frameId]) => {
          log.warn(
            'Got a request to forward a keyboard event from an unknown source.',
            { tabId, frameId },
          )
        })
    })
  }
}

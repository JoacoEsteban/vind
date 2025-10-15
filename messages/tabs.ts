import { getMessage } from '@extend-chrome/messages'
import { splitMessage } from './lib'

export const [showOverlay, showOverlayStream, waitForShowOverlay] =
  getMessage<void>('showOverlay')

export const wakeUp = splitMessage(getMessage<void>('wakeUp'))

export type KeyboardEventDto = {
  type: string
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  isBindable: boolean
}

export const forwardKeyEvent = splitMessage(
  getMessage<KeyboardEventDto>('forwardKeyEvent'),
)

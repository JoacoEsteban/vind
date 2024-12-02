import { getMessage } from '@extend-chrome/messages'
import { splitMessage } from './lib'

export const [showOverlay, showOverlayStream, waitForShowOverlay] =
  getMessage<void>('showOverlay')

export const wakeUp = splitMessage(getMessage<void>('wakeUp'))

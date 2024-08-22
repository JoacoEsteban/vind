import { getMessage } from '@extend-chrome/messages'
import { splitMessage } from '~/messages/lib'

export const newBinding = splitMessage(getMessage<void>(
  'ask-for-binding'
))

export const [askForOptionsPage, askForOptionsPageStream, waitForOptionsPage] = getMessage<void>(
  'ask-for-options-page'
)

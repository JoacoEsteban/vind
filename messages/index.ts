import { getMessage } from '@extend-chrome/messages'

export const [askForBinding, askForBindingStream, waitForBinding] = getMessage<void>(
  'ask-for-binding'
)

export const [askForOptionsPage, askForOptionsPageStream, waitForOptionsPage] = getMessage<void>(
  'ask-for-options-page'
)

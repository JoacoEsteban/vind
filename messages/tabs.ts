import { getMessage } from '@extend-chrome/messages'

export const [
  getCurrentUrl,
  getCurrentUrlStream,
  waitForCurrentUrl
] = getMessage<void, string | null>(
  'getCurrentUrl',
  { async: true }
)

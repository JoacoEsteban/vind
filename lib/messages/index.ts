import { deserializeError } from '~lib/error'
import type { ErrResponse } from '~messages/storage'

export function throwOnResponseError (response: ErrResponse) {
  if (response.error) {
    throw deserializeError(response.error)
  }
}
import { deserializeError } from '~lib/error'
import type { ErrResponse } from '~messages/storage'

export function throwOnResponseError<T> (response: ErrResponse<T>): T {
  if (response.error) {
    throw deserializeError(response.error)
  }

  return response.value!
}
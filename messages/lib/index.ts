import type { getMessage } from '@extend-chrome/messages'

type Message<T, R = void> = R extends void ? ReturnType<typeof getMessage<T>> : ReturnType<typeof getMessage<T, R>>

export type SplittedMessage<T, R> = {
  ask: Message<T, R>[0] // TODO rename
  stream: Message<T, R>[1]
  wait: Message<T, R>[2]
}

export function splitMessage<T, R = void> (message: Message<T, R>): SplittedMessage<T, R> {
  const [ask, stream, wait] = message
  return {
    ask,
    stream,
    wait
  }
}

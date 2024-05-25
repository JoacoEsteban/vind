import { BehaviorSubject, Subject } from 'rxjs'
import { log } from './log'
import type { SymbolName } from './symbols'
import { PromiseWithResolvers } from './polyfills'

type PromptOptions = {
  title?: string,
  subtitle?: string,
  placeholder?: string,
  value?: string,
  type?: string,
  symbol?: SymbolName
}

export type Prompt = {
  options: PromptOptions,
  resolve: (value: string) => void,
  reject: (reason: any) => void,
  promise: Promise<string>
}

const PromptSubject = new Subject<Prompt>()
const PromptOpen$ = new BehaviorSubject<boolean>(false)
export const Prompt$ = PromptSubject.asObservable()
export const isPromptOpen$ = PromptOpen$.asObservable()

export function prompt (options: PromptOptions = {}) {
  log.debug('Prompting:', options)

  let { promise, reject, resolve } = PromiseWithResolvers<string>()
  promise = promise
    .catch((err) => {
      log.debug('Prompt error:', err)
      if (err === null) return ''
      throw err
    })
    .finally(() => {
      log.debug('Prompt closed')
      PromptOpen$.next(false)
    })

  PromptSubject.next({ options, resolve, reject, promise })
  PromptOpen$.next(true)
  return {
    promise,
    cancel: reject
  }
}
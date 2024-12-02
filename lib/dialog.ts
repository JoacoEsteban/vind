import { BehaviorSubject, Subject } from 'rxjs'
import { log } from './log'
import type { SymbolName } from './symbols'
import { PromiseWithResolvers } from './polyfills'
import { match } from 'ts-pattern'

export type ReturnOfPrompt<T extends PromptType> = T extends PromptType.Boolean
  ? boolean
  : string
export type AnyReturnOfPrompt =
  | ReturnOfPrompt<PromptType.PathEdit>
  | ReturnOfPrompt<PromptType.Boolean>

export enum PromptType {
  Boolean = 'boolean',
  PathEdit = 'path-edit',
}

type PromptOptions<T extends PromptType> = {
  title?: string
  subtitle?: string
  placeholder?: string
  symbol?: SymbolName
  value?: ReturnOfPrompt<T>
  type: T
}

export type Prompt<T extends PromptType> = {
  options: PromptOptions<T>
  resolve: (value: ReturnOfPrompt<T>) => void
  reject: (reason: any) => void
  promise: Promise<ReturnOfPrompt<T>>
}

export type AnyPrompt = Prompt<PromptType.PathEdit> | Prompt<PromptType.Boolean>

const PromptSubject = new Subject<Prompt<PromptType.PathEdit>>()
const BooleanPromptSubject = new Subject<Prompt<PromptType.Boolean>>()
const PromptOpen$ = new BehaviorSubject<boolean>(false)

export const Prompt$ = PromptSubject.asObservable()
export const BooleanPrompt$ = BooleanPromptSubject.asObservable()
export const isPromptOpen$ = PromptOpen$.asObservable()

export function prompt<T extends PromptType>(options: PromptOptions<T>) {
  if (PromptOpen$.value) {
    throw new Error('A prompt is already open')
  }

  log.debug('Prompting:', options)

  let { promise, reject, resolve } =
    PromiseWithResolvers<ReturnOfPrompt<T> | null>()
  promise = promise
    .catch((err) => {
      log.debug('Prompt error:', err)
      if (err === null) return null
      throw err
    })
    .finally(() => {
      log.debug('Prompt closed')
      PromptOpen$.next(false)
    })

  match<PromptType, void>(options.type) // TODO resolve more gracefully
    .with(PromptType.Boolean, () => {
      BooleanPromptSubject.next({
        options: options as PromptOptions<PromptType.Boolean>,
        resolve: resolve as (value: boolean) => void,
        reject,
        promise: promise as Promise<boolean>,
      })
    })
    .with(PromptType.PathEdit, () => {
      PromptSubject.next({
        options: options as PromptOptions<PromptType.PathEdit>,
        resolve: resolve as (value: string) => void,
        reject,
        promise: promise as Promise<string>,
      })
    })

  PromptOpen$.next(true)
  return {
    promise,
    cancel: reject,
  }
}

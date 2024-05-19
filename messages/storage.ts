import { getMessage } from '@extend-chrome/messages'
import type { BindingDoc, DisabledBindingPathDoc } from '~background/storage/db'
import { splitMessage } from './lib'

export type ErrResponse = {
  error: string | null
}

export type DisabledPathPayload = {
  domain: string
  path: string
}

export const bindingsMessages = {
  getAllBindings: splitMessage(getMessage<void, BindingDoc[]>(
    'getAllBindings',
    { async: true }
  )),
  getBindingsForDomain: splitMessage(getMessage<string, BindingDoc[]>(
    'getBindingsForDomain',
    { async: true }
  )),
  getBindingsForSite: splitMessage(getMessage<{ domain: string, path: string }, BindingDoc[]>(
    'getBindingsForSite',
    { async: true }
  )),
  // ---------------------
  addBinding: splitMessage(getMessage<BindingDoc, ErrResponse>(
    'addBinding',
    { async: true }
  )),
  updateBinding: splitMessage(getMessage<BindingDoc, ErrResponse>(
    'updateBinding',
    { async: true }
  )),
  upsertBinding: splitMessage(getMessage<BindingDoc, ErrResponse>(
    'upsertBinding',
    { async: true }
  )),
  removeBinding: splitMessage(getMessage<string, ErrResponse>(
    'removeBinding',
    { async: true }
  )),
  // ---------------------
  onBindingRemoved: splitMessage(getMessage<BindingDoc>(
    'onBindingRemoved',
  )),
  onBindingAdded: splitMessage(getMessage<BindingDoc>(
    'onBindingAdded',
  )),
  onBindingUpdated: splitMessage(getMessage<BindingDoc>(
    'onBindingUpdated',
  )),
}

export const disabledPathsMessages = {
  getAllDisabledPaths: splitMessage(getMessage<void, DisabledBindingPathDoc[]>(
    'getAllDisabledPaths',
    { async: true }
  )),
  queryDisabledPaths: splitMessage(getMessage<DisabledPathPayload, DisabledBindingPathDoc[]>(
    'queryDisabledPaths',
    { async: true }
  )),
  // ---------------------
  disablePath: splitMessage(getMessage<DisabledPathPayload, ErrResponse>(
    'disablePath',
    { async: true }
  )),
  enablePath: splitMessage(getMessage<DisabledPathPayload, ErrResponse>(
    'enablePath',
    { async: true }
  )),
  togglePath: splitMessage(getMessage<DisabledPathPayload, ErrResponse>(
    'togglePath',
    { async: true }
  )),
  // ---------------------
  onDisabledBindingPathRemoved: splitMessage(getMessage<DisabledBindingPathDoc>(
    'onDisabledBindingPathRemoved',
  )),
  onDisabledBindingPathAdded: splitMessage(getMessage<DisabledBindingPathDoc>(
    'onDisabledBindingPathAdded',
  )),
}

import { getMessage } from '@extend-chrome/messages'
import type { BindingDoc, PageOverrideDoc, PageOverrideInsertType } from '~background/storage/db'
import { splitMessage } from './lib'

export type ErrResponse = {
  error: string | null
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

export const pageOverridesMessages = {
  getAllPageOverrides: splitMessage(getMessage<void, PageOverrideDoc[]>(
    'getAllPageOverrides',
    { async: true }
  )),
  getPageOverridesForDomain: splitMessage(getMessage<string, PageOverrideDoc[]>(
    'getPageOverridesForDomain',
    { async: true }
  )),
  getPageOverridesForSite: splitMessage(getMessage<{ domain: string, path: string }, PageOverrideDoc[]>(
    'getPageOverridesForSite',
    { async: true }
  )),
  // ---------------------
  addPageOverride: splitMessage(getMessage<PageOverrideInsertType, ErrResponse>(
    'addPageOverride',
    { async: true }
  )),
  togglePageOverride: splitMessage(getMessage<PageOverrideInsertType, ErrResponse>(
    'togglePageOverride',
    { async: true }
  )),
  updatePageOverride: splitMessage(getMessage<PageOverrideDoc, ErrResponse>(
    'updatePageOverride',
    { async: true }
  )),
  upsertPageOverride: splitMessage(getMessage<PageOverrideDoc, ErrResponse>(
    'upsertPageOverride',
    { async: true }
  )),
  removePageOverride: splitMessage(getMessage<number, ErrResponse>(
    'removePageOverride',
    { async: true }
  )),
  // ---------------------
  onPageOverrideRemoved: splitMessage(getMessage<PageOverrideDoc>(
    'onPageOverrideRemoved',
  )),
  onPageOverrideAdded: splitMessage(getMessage<PageOverrideDoc>(
    'onPageOverrideAdded',
  )),
  onPageOverrideUpdated: splitMessage(getMessage<PageOverrideDoc>(
    'onPageOverrideUpdated',
  )),
}

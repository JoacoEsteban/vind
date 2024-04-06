import { getMessage } from '@extend-chrome/messages'
import type { BindingDoc, PageOverrideDoc, PageOverrideInsertType } from '~background/storage/db'
import { splitMessage } from './lib'

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
  addBinding: splitMessage(getMessage<BindingDoc>(
    'addBinding',
  )),
  updateBinding: splitMessage(getMessage<BindingDoc>(
    'updateBinding',
  )),
  removeBinding: splitMessage(getMessage<string>(
    'removeBinding',
  )),
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
  addPageOverride: splitMessage(getMessage<PageOverrideInsertType>(
    'addPageOverride',
  )),
  togglePageOverride: splitMessage(getMessage<PageOverrideInsertType>(
    'togglePageOverride',
  )),
  updatePageOverride: splitMessage(getMessage<PageOverrideDoc>(
    'updatePageOverride',
  )),
  removePageOverride: splitMessage(getMessage<number>(
    'removePageOverride',
  )),
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

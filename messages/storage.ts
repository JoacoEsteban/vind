import { getMessage } from '@extend-chrome/messages'
import type { BindingDoc } from '~background/storage/db'
import { splitMessage } from './lib'

export const storage = {
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

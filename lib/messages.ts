import { storage } from '~messages/storage'
import { Binding } from './binding'
import type { BindingDoc } from '~background/storage/db'
import { log } from './log'
import { urlFromParts } from './url'
import { filter } from 'rxjs'

export interface BindingChannel {
  getAllBindings: () => Promise<Binding[]>
  getBindingsForDomain: (domain: string) => Promise<Binding[]>
  getBindingsForSite: (url: URL) => Promise<Binding[]>
  addBinding: (binding: Binding) => Promise<void>
  updateBinding: (binding: Binding) => Promise<void>
  removeBinding: (id: string) => Promise<void>
}

export function toBindingDoc (binding: Binding): BindingDoc {
  const url = new URL(binding.site)
  return {
    id: binding.id,
    domain: url.host,
    path: url.pathname,
    key: binding.key,
    selector: binding.selector
  }
}

export function fromBindingDoc (doc: BindingDoc): Binding {
  const url = urlFromParts(doc.domain, doc.path).href
  return new Binding(url, doc.key, doc.selector, doc.id)
}

export function fromManyBindingDoc (docs: BindingDoc[]): Binding[] {
  return docs.map(fromBindingDoc)
}

export class BindingChannelImpl implements BindingChannel {
  public onBindingRemoved$ = storage.onBindingRemoved.stream
  public onBindingAdded$ = storage.onBindingAdded.stream
  public onBindingUpdated$ = storage.onBindingUpdated.stream

  async getAllBindings () {
    return storage.getAllBindings.ask().then(fromManyBindingDoc)
  }
  async getBindingsForDomain (domain: string) {
    return storage.getBindingsForDomain.ask(domain).then(fromManyBindingDoc)
  }
  async getBindingsForSite (url: URL) {
    return storage.getBindingsForSite.ask({
      domain: url.host,
      path: url.pathname
    }).then(fromManyBindingDoc)
  }
  async addBinding (binding: Binding) {
    const doc = toBindingDoc(binding)
    return storage.addBinding.ask(doc)
  }
  async updateBinding (binding: Binding) {
    const doc = toBindingDoc(binding)
    return storage.updateBinding.ask(doc)
  }
  async removeBinding (id: string) {
    return storage.removeBinding.ask(id)
  }
}
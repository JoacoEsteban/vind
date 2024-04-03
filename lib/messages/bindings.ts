import { storage } from '~messages/storage'
import { Binding } from '../binding'
import type { BindingDoc } from '~background/storage/db'
import { log } from '../log'
import { Domain, Path, urlFromParts } from '../url'
import { filter } from 'rxjs'

export interface BindingChannel {
  getAllBindings: () => Promise<Binding[]>
  getBindingsForDomain: (domain: string) => Promise<Binding[]>
  getBindingsForSite: (url: URL) => Promise<Binding[]>
  addBinding: (binding: Binding) => void
  updateBinding: (binding: Binding) => void
  removeBinding: (id: string) => void
}

export function toBindingDoc (binding: Binding): BindingDoc {
  return {
    id: binding.id,
    domain: binding.domain.value,
    path: binding.path.value,
    key: binding.key,
    selector: binding.selector
  }
}

export function fromBindingDoc (doc: BindingDoc): Binding {
  return new Binding(new Domain(doc.domain), new Path(doc.path), doc.key, doc.selector, doc.id)
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
  addBinding (binding: Binding) {
    const doc = toBindingDoc(binding)
    return storage.addBinding.ask(doc)
  }
  updateBinding (binding: Binding) {
    const doc = toBindingDoc(binding)
    return storage.updateBinding.ask(doc)
  }
  removeBinding (id: string) {
    return storage.removeBinding.ask(id)
  }
}
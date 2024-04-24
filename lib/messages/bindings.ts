import { bindingsMessages } from '~messages/storage'
import { Binding } from '../binding'
import type { BindingDoc } from '~background/storage/db'
import { log } from '../log'
import { Domain, Path, urlFromParts } from '../url'
import { filter } from 'rxjs'
import { throwOnResponseError } from '.'

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
  public onBindingRemoved$ = bindingsMessages.onBindingRemoved.stream
  public onBindingAdded$ = bindingsMessages.onBindingAdded.stream
  public onBindingUpdated$ = bindingsMessages.onBindingUpdated.stream

  async getAllBindings () {
    return bindingsMessages.getAllBindings.ask().then(fromManyBindingDoc)
  }
  async getBindingsForDomain (domain: string) {
    return bindingsMessages.getBindingsForDomain.ask(domain).then(fromManyBindingDoc)
  }
  async getBindingsForSite (url: URL) {
    return bindingsMessages.getBindingsForSite.ask({
      domain: url.host,
      path: url.pathname
    }).then(fromManyBindingDoc)
  }
  addBinding (binding: Binding) {
    const doc = toBindingDoc(binding)
    return bindingsMessages.addBinding.ask(doc).then(throwOnResponseError)
  }
  updateBinding (binding: Binding) {
    const doc = toBindingDoc(binding)
    return bindingsMessages.updateBinding.ask(doc).then(throwOnResponseError)
  }
  removeBinding (id: string) {
    return bindingsMessages.removeBinding.ask(id).then(throwOnResponseError)
  }
}
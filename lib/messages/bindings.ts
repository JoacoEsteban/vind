import { bindingsMessages } from '~messages/storage'
import { Binding } from '../binding'
import type { BindingDoc } from '~background/storage/db'
import { log } from '../log'
import { Domain, Path, urlFromParts } from '../url'
import { Observable, Subject, filter } from 'rxjs'
import { throwOnResponseError } from '.'
import { XPathObject } from '~lib/xpath'
import { match } from 'ts-pattern'

export interface BindingChannel {
  getAllBindings: () => Promise<Binding[]>
  getBindingsForDomain: (domain: string) => Promise<Binding[]>
  getBindingsForSite: (url: URL) => Promise<Binding[]>
  addBinding: (binding: Binding) => void
  updateBinding: (binding: Binding) => void
  upsertBinding: (binding: Binding) => void
  removeBinding: (id: string) => void
  deleteAllBindings: () => void
  moveBindings: (domain: Domain, from: Path, to: Path) => Promise<void>
  changeKey: (id: string, key: string) => Promise<void>
  onBindingRemoved$: Observable<unknown>
  onBindingAdded$: Observable<unknown>
  onBindingUpdated$: Observable<unknown>
}

export function toBindingDoc(binding: Binding): BindingDoc {
  return {
    id: binding.id,
    domain: binding.domain.value,
    path: binding.path.value,
    key: binding.key,
    selector: binding.selector,
    xpathObject: binding.xpathObject?.toSerializable() || null,
  }
}

export function fromBindingDoc(doc: BindingDoc): Binding {
  const xpathObject = match(doc.xpathObject)
    .with(undefined, null, () => null)
    .otherwise(XPathObject.fromSerializable)

  return new Binding(
    new Domain(doc.domain),
    new Path(doc.path),
    doc.key,
    doc.selector,
    xpathObject,
    doc.id,
  )
}

export function fromManyBindingDoc(docs: BindingDoc[]): Binding[] {
  return docs.map(fromBindingDoc)
}

export class BindingChannelImpl implements BindingChannel {
  public onBindingRemoved$ = bindingsMessages.onBindingRemoved.stream
  public onBindingAdded$ = bindingsMessages.onBindingAdded.stream
  public onBindingUpdated$ = bindingsMessages.onBindingUpdated.stream

  async getAllBindings() {
    return bindingsMessages.getAllBindings.ask().then(fromManyBindingDoc)
  }
  async getBindingsForDomain(domain: string) {
    return bindingsMessages.getBindingsForDomain
      .ask(domain)
      .then(fromManyBindingDoc)
  }
  async getBindingsForSite(url: URL) {
    return bindingsMessages.getBindingsForSite
      .ask({
        domain: url.host,
        path: url.pathname,
      })
      .then(fromManyBindingDoc)
  }
  addBinding(binding: Binding) {
    const doc = toBindingDoc(binding)
    return bindingsMessages.addBinding.ask(doc).then(throwOnResponseError)
  }
  updateBinding(binding: Binding) {
    const doc = toBindingDoc(binding)
    return bindingsMessages.updateBinding.ask(doc).then(throwOnResponseError)
  }
  upsertBinding(binding: Binding) {
    const doc = toBindingDoc(binding)
    return bindingsMessages.upsertBinding.ask(doc).then(throwOnResponseError)
  }
  removeBinding(id: string) {
    return bindingsMessages.removeBinding.ask(id).then(throwOnResponseError)
  }
  moveBindings(domain: Domain, from: Path, to: Path) {
    return bindingsMessages.moveBindings
      .ask({
        domain: domain.value,
        from: from.value,
        to: to.value,
      })
      .then(throwOnResponseError)
  }
  deleteAllBindings() {
    return bindingsMessages.deleteAllBindings.ask().then(throwOnResponseError)
  }
  changeKey(id: string, key: string) {
    return bindingsMessages.changeKey
      .ask({ id, key })
      .then(throwOnResponseError)
  }
}

export class MemoryBindingChannelImpl implements BindingChannel {
  private bindingRemoved$ = new Subject()
  private bindingAdded$ = new Subject()
  private bindingUpdated$ = new Subject()
  public onBindingRemoved$ = this.bindingRemoved$.asObservable()
  public onBindingAdded$ = this.bindingAdded$.asObservable()
  public onBindingUpdated$ = this.bindingUpdated$.asObservable()

  private bindings: Binding[] = []

  async getAllBindings() {
    return [...this.bindings]
  }
  async getBindingsForDomain(domain: string) {
    // TODO
    return this.getAllBindings()
  }
  async getBindingsForSite(url: URL) {
    // TODO
    return this.getAllBindings()
  }
  addBinding(binding: Binding) {
    this.bindings.push(binding)
    this.bindingAdded$.next(null)
  }
  updateBinding(binding: Binding) {
    const { id } = binding
    const index = this.bindings.findIndex((b) => b.id === id)
    if (index === -1) return false
    this.bindings.splice(index, 1, binding)
    this.bindingUpdated$.next(null)
  }
  upsertBinding(binding: Binding) {
    if (!this.updateBinding(binding)) {
      this.addBinding(binding)
    }
  }
  removeBinding(id: string) {
    this.bindings = this.bindings.filter((b) => b.id === id)
    this.bindingRemoved$.next(null)
  }
  async moveBindings(domain: Domain, from: Path, to: Path) {
    // TODO
    throw new Error('Not implemented')
  }
  deleteAllBindings() {
    this.bindings = []
    this.bindingRemoved$.next(null)
  }
  async changeKey(id: string, key: string) {
    const binding = this.bindings.find((b) => b.id === id)
    if (!binding) throw new Error('Binding does not exist')

    this.updateBinding(
      new Binding(
        binding.domain,
        binding.path,
        key,
        binding.selector,
        binding.xpathObject,
        binding.id,
      ),
    )
  }
}

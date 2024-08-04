import type Dexie from 'dexie'
import type { BindingDoc, VindDB } from './db'
import { log } from '~lib/log'
import { Observable, Subject } from 'rxjs'
import type { Domain, Path } from '~lib/url'

export interface BindingsStorage {
  getAllBindings: () => Promise<BindingDoc[]>
  getBindingsForDomain: (domain: string) => Promise<BindingDoc[]>
  getBindingsForSite: (domain: string, site: string) => Promise<BindingDoc[]>
  query: (domain: string, site: string) => Promise<BindingDoc[]>
  addBinding: (binding: BindingDoc) => Promise<void>
  updateBinding: (binding: BindingDoc) => Promise<void>
  upsertBinding: (binding: BindingDoc) => Promise<void>
  removeBinding: (id: string) => Promise<void>
  changeKey: (id: string, key: string) => Promise<void>
  moveBindings: (domain: Domain, from: Path, to: Path) => Promise<void>
  deleteAllBindings: () => Promise<void>
  onDeleted$: Observable<BindingDoc>
  onAdded$: Observable<BindingDoc>
  onUpdated$: Observable<BindingDoc>
  onPathChange$: Observable<{
    domain: Domain
    from: Path
    to: Path
  }>
}

export class BindingsStorageImpl implements BindingsStorage {
  private collection: Dexie.Table<BindingDoc, string>
  private onDeletedSubject = new Subject<BindingDoc>()
  public onDeleted$ = this.onDeletedSubject.asObservable()
  private onAddedSubject = new Subject<BindingDoc>()
  public onAdded$ = this.onAddedSubject.asObservable()
  private onUpdatedSubject = new Subject<BindingDoc>()
  public onUpdated$ = this.onUpdatedSubject.asObservable()
  private onPathChangeSubject = new Subject<{
    domain: Domain
    from: Path
    to: Path
  }>()
  public onPathChange$ = this.onPathChangeSubject.asObservable()

  constructor(
    private db: VindDB
  ) {
    this.collection = db.bindings

    this.collection.hook('creating', (primKey, obj, transaction) => {
      log.info('Creating binding', { primKey, obj, transaction })
      transaction.on('complete', () => this.onAddedSubject.next(obj))
    })
    this.collection.hook('updating', (modifications, primKey, obj, transaction) => {
      log.info('Updating binding', { modifications, primKey, obj, transaction })
      transaction.on('complete', () => this.onUpdatedSubject.next(obj))
    })
    this.collection.hook('deleting', (primKey, obj, transaction) => {
      log.info('Deleting binding', { primKey, obj, transaction })
      transaction.on('complete', () => this.onDeletedSubject.next(obj))
    })

    log.info('Bindings storage initialized')
  }

  async getAllBindings (): Promise<BindingDoc[]> {
    return (await this.collection.toArray())
  }

  async getBindingsForDomain (domain: string): Promise<BindingDoc[]> {
    return (await this.collection.where('domain').equals(domain).toArray())
  }

  async getBindingsForSite (domain: string, site: string): Promise<BindingDoc[]> {
    return this.collection.where('domain').equals(domain).and((binding) => site.startsWith(binding.path)).toArray()
  }

  async query (domain: string, site: string): Promise<BindingDoc[]> {
    console.log({ domain, site })
    return this.collection.where(['domain', 'path']).equals([domain, site]).toArray()
  }

  async addBinding (binding: BindingDoc): Promise<void> {
    await this.collection.add(binding)
  }

  async updateBinding (binding: BindingDoc): Promise<void> {
    await this.collection.update(binding.id, binding)
  }

  async upsertBinding (binding: BindingDoc): Promise<void> {
    await this.collection.put(binding)
  }

  async removeBinding (id: string): Promise<void> {
    return this.collection.delete(id)
  }

  async changeKey (id: string, key: string): Promise<void> {
    const binding = await this.collection.get(id)
    if (!binding) throw new Error('Binding not found')
    binding.key = key
    await this.collection.update(id, binding)
  }

  async moveBindings (domain: Domain, from: Path, to: Path): Promise<void> {
    const bindings = await this.collection.where('domain').equals(domain.value).and((binding) => binding.path === from.value).toArray()
    log.debug('Moving bindings', { domain: domain.value, from: from.value, to: to.value }, bindings)

    await Promise.all(bindings.map((binding) => {
      binding.path = to.value
      return this.collection.update(binding.id, binding)
    }))

    this.onPathChangeSubject.next({ domain, from, to })
  }

  async deleteAllBindings (): Promise<void> {
    await this.collection.clear()
  }
}
import type Dexie from 'dexie'
import type { BindingDoc, VindDB } from './db'
import { log } from '~lib/log'
import { Observable, Subject } from 'rxjs'

export interface BindingsStorage {
  getAllBindings: () => Promise<BindingDoc[]>
  getBindingsForDomain: (domain: string) => Promise<BindingDoc[]>
  getBindingsForSite: (domain: string, site: string) => Promise<BindingDoc[]>
  addBinding: (binding: BindingDoc) => Promise<void>
  updateBinding: (binding: BindingDoc) => Promise<void>
  removeBinding: (id: string) => Promise<void>
  onDeleted$: Observable<BindingDoc>
  onAdded$: Observable<BindingDoc>
  onUpdated$: Observable<BindingDoc>
}

export class BindingsStorageImpl implements BindingsStorage {
  private collection: Dexie.Table<BindingDoc, string>
  private onDeletedSubject = new Subject<BindingDoc>()
  public onDeleted$ = this.onDeletedSubject.asObservable()
  private onAddedSubject = new Subject<BindingDoc>()
  public onAdded$ = this.onAddedSubject.asObservable()
  private onUpdatedSubject = new Subject<BindingDoc>()
  public onUpdated$ = this.onUpdatedSubject.asObservable()

  constructor(
    private db: VindDB
  ) {
    this.collection = db.bindings

    this.collection.hook('updating', (modifications, primKey, obj, transaction) => {
      log.info('Updating binding', { modifications, primKey, obj, transaction })
      this.onUpdatedSubject.next(obj)
    })
    this.collection.hook('creating', (primKey, obj, transaction) => {
      log.info('Creating binding', { primKey, obj, transaction })
      this.onAddedSubject.next(obj)
    })
    this.collection.hook('deleting', (primKey, obj, transaction) => {
      log.info('Deleting binding', { primKey, obj, transaction })
      this.onDeletedSubject.next(obj)
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
    return (await this.collection.where('domain').equals(domain).and((binding) => site.startsWith(binding.path)).toArray())
  }

  async addBinding (binding: BindingDoc): Promise<void> {
    await this.collection.add(binding)
  }

  async updateBinding (binding: BindingDoc): Promise<void> {
    await this.collection.update(binding.id, binding)
  }

  async removeBinding (id: string): Promise<void> {
    return this.collection.delete(id)
  }
}
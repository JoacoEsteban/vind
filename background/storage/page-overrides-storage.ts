import type { PageOverrideDoc, PageOverrideInsertType, VindDB } from './db'
import { log } from '~lib/log'
import { Observable, Subject } from 'rxjs'

export interface PageOverridesStorage {
  getAllPageOverrides: () => Promise<PageOverrideDoc[]>
  getPageOverridesForSite: (domain: string, site: string) => Promise<PageOverrideDoc[]>
  addPageOverride: (pageOverride: PageOverrideInsertType) => Promise<void>
  togglePageOverride: (pageOverride: PageOverrideInsertType) => Promise<void>
  updatePageOverride: (pageOverride: PageOverrideDoc) => Promise<void>
  removePageOverride: (id: number) => Promise<void>
  onDeleted$: Observable<PageOverrideDoc>
  onAdded$: Observable<PageOverrideDoc>
  onUpdated$: Observable<PageOverrideDoc>
}

export class PageOverridesStorageImpl implements PageOverridesStorage {
  private collection: typeof VindDB.prototype.pageOverrides
  private onDeletedSubject = new Subject<PageOverrideDoc>()
  public onDeleted$ = this.onDeletedSubject.asObservable()
  private onAddedSubject = new Subject<PageOverrideDoc>()
  public onAdded$ = this.onAddedSubject.asObservable()
  private onUpdatedSubject = new Subject<PageOverrideDoc>()
  public onUpdated$ = this.onUpdatedSubject.asObservable()

  constructor(
    private db: VindDB
  ) {
    this.collection = db.pageOverrides

    this.collection.hook('updating', (modifications, primKey, obj, transaction) => {
      log.info('Updating pageOverride', { modifications, primKey, obj, transaction })
      this.onUpdatedSubject.next(obj)
    })
    this.collection.hook('creating', (primKey, obj, transaction) => {
      log.info('Creating pageOverride', { primKey, obj, transaction })
      this.onAddedSubject.next(obj)
    })
    this.collection.hook('deleting', (primKey, obj, transaction) => {
      log.info('Deleting pageOverride', { primKey, obj, transaction })
      this.onDeletedSubject.next(obj)
    })

    log.info('PageOverrides storage initialized')
  }

  async getAllPageOverrides (): Promise<PageOverrideDoc[]> {
    return (await this.collection.toArray())
  }

  async getPageOverridesForSite (domain: string, path: string): Promise<PageOverrideDoc[]> {
    const domain_path = [domain, path].join('/')
    log.info('getPageOverridesForSite', { domain, site: path }, domain_path)
    return (await this.collection.where('overrides_domain_path').startsWith(domain_path).toArray())
  }

  async addPageOverride (pageOverride: PageOverrideInsertType): Promise<void> {
    log.info('adding pageOverride', pageOverride, pageOverride.overrides_domain_path)

    const exists = await this.collection.where({
      'overrides_domain_path': pageOverride.overrides_domain_path,
      'bindings_path': pageOverride.bindings_path,
    }).count() > 0

    log.info('addPageOverride', { pageOverride, exists })

    if (!exists) {
      await this.collection.add(pageOverride)
    }
  }

  async togglePageOverride (pageOverride: PageOverrideInsertType): Promise<void> {
    log.info('toggling pageOverride', pageOverride, pageOverride.overrides_domain_path)

    const existingOverride = await this.collection.where({
      'overrides_domain_path': pageOverride.overrides_domain_path,
      'bindings_path': pageOverride.bindings_path,
    }).first()
    const exists = Boolean(existingOverride)

    log.info('togglePageOverride', { pageOverride, existingOverride })

    return exists ? this.removePageOverride(existingOverride!.id) : this.addPageOverride(pageOverride)
  }

  async updatePageOverride (pageOverride: PageOverrideDoc): Promise<void> {
    const insert: PageOverrideInsertType = {
      overrides_domain_path: pageOverride.overrides_domain_path,
      bindings_path: pageOverride.bindings_path
    }

    await this.collection.update(pageOverride.id, insert)
  }

  async removePageOverride (id: number): Promise<void> {
    return this.collection.delete(id)
  }
}
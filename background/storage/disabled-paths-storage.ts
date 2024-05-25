import type { DisabledBindingPathDoc, VindDB } from './db'
import { log } from '~lib/log'
import { Observable, Subject } from 'rxjs'
import { Domain, Path } from '~lib/url'
import { match } from 'ts-pattern'

export interface DisabledBindingPathsStorage {
  getAllDisabledPaths: () => Promise<DisabledBindingPathDoc[]>
  query: (domain: Domain, path: Path) => Promise<DisabledBindingPathDoc[]>
  addEntry: (domain: Domain, path: Path) => Promise<void>
  removeEntry: (domain: Domain, path: Path) => Promise<void>
  renameEntry: (domain: Domain, from: Path, to: Path) => Promise<void>
  togglePath: (domain: Domain, path: Path) => Promise<boolean>
  onDeleted$: Observable<DisabledBindingPathDoc>
  onAdded$: Observable<DisabledBindingPathDoc>
}

export class DisabledBindingPathsStorageImpl implements DisabledBindingPathsStorage {
  private collection: typeof VindDB.prototype.disabledBindingPaths
  private onDeletedSubject = new Subject<DisabledBindingPathDoc>()
  public onDeleted$ = this.onDeletedSubject.asObservable()
  private onAddedSubject = new Subject<DisabledBindingPathDoc>()
  public onAdded$ = this.onAddedSubject.asObservable()

  constructor(
    private db: VindDB
  ) {
    this.collection = db.disabledBindingPaths

    this.collection.hook('creating', (primKey, obj, transaction) => {
      log.info('Creating disabled path', { primKey, obj, transaction })
      transaction.on('complete', () => this.onAddedSubject.next(obj))
    })
    this.collection.hook('deleting', (primKey, obj, transaction) => {
      log.info('Deleting disabled path', { primKey, obj, transaction })
      transaction.on('complete', () => this.onDeletedSubject.next(obj))
    })

    log.info('Disabled paths storage initialized')
  }

  async getAllDisabledPaths (): Promise<DisabledBindingPathDoc[]> {
    return (await this.collection.toArray())
  }

  async query (domain: Domain, path: Path): Promise<DisabledBindingPathDoc[]> {
    const domain_path = domain.join(path)
    log.info('query disabled paths', { domain, site: path }, domain_path)
    return this.collection.where('domain_path').startsWith(domain_path).toArray()
  }

  async addEntry (domain: Domain, path: Path): Promise<void> {
    const domain_path = domain.join(path)
    log.info('adding disabled path entry', { domain, path, domain_path })

    return this.collection.put({
      domain_path
    })
  }

  async removeEntry (domain: Domain, path: Path): Promise<void> {
    const domain_path = domain.join(path)
    log.info('reomving disabled path entry', { domain, path, domain_path })

    await this.collection.where('domain_path').equals(domain_path).delete()
  }

  async renameEntry (domain: Domain, from: Path, to: Path): Promise<void> {
    const domain_from = domain.join(from)
    const domain_to = domain.join(to)
    log.info('renaming disabled path', { domain, from, to, domain_from, domain_to })

    if (await this.collection.where('domain_path').equals(domain_to).first()) {
      return this.removeEntry(domain, from)
    }

    await this.collection.where('domain_path').equals(domain_from).modify({ domain_path: domain_to })
  }

  async togglePath (domain: Domain, path: Path): Promise<boolean> {
    const domain_path = domain.join(path)
    log.info('togglePath', { domain, path, domain_path })

    return match(await this.collection.where('domain_path').equals(domain_path).first())
      .when(Boolean, async () => {
        await this.removeEntry(domain, path)
        return true
      })
      .otherwise(async () => {
        await this.addEntry(domain, path)
        return false
      })
  }
}
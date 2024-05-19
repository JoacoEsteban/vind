import type { DisabledBindingPathDoc, VindDB } from './db'
import { log } from '~lib/log'
import { Observable, Subject } from 'rxjs'
import { Domain, Path } from '~lib/url'
import { match } from 'ts-pattern'

export interface DisabledBindingPathsStorage {
  getAllDisabledPaths: () => Promise<DisabledBindingPathDoc[]>
  query: (domain: Domain, path: Path) => Promise<DisabledBindingPathDoc[]>
  disablePath: (domain: Domain, path: Path) => Promise<void>
  enablePath: (domain: Domain, path: Path) => Promise<void>
  togglePath: (domain: Domain, path: Path) => Promise<void>
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
      this.onAddedSubject.next(obj)
    })
    this.collection.hook('deleting', (primKey, obj, transaction) => {
      log.info('Deleting disabled path', { primKey, obj, transaction })
      this.onDeletedSubject.next(obj)
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

  async disablePath (domain: Domain, path: Path): Promise<void> {
    const domain_path = domain.join(path)
    log.info('disabling path', { domain, path, domain_path })

    return this.collection.put({
      domain_path
    })
  }

  async enablePath (domain: Domain, path: Path): Promise<void> {
    const domain_path = domain.join(path)
    log.info('disabling path', { domain, path, domain_path })

    await this.collection.where('domain_path').equals(domain_path).delete()
  }

  async togglePath (domain: Domain, path: Path): Promise<void> {
    const domain_path = domain.join(path)
    log.info('togglePath', { domain, path, domain_path })

    return match(await this.collection.where('domain_path').equals(domain_path).first())
      .when(Boolean, () => this.enablePath(domain, path))
      .otherwise(() => this.disablePath(domain, path))
  }
}
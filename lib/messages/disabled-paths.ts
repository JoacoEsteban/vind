import {
  disabledPathsMessages,
  type DisabledPathPayload,
} from '~messages/storage'
import type { DisabledBindingPathDoc } from '~background/storage/db'
import { Domain, Path, urlFromParts } from '../url'
import { throwOnResponseError } from '.'
import { Subject, type Observable } from 'rxjs'
import { Ray } from 'three'

export interface DisabledPathsChannel {
  getAllDisabledPaths: () => Promise<Set<string>>
  queryDisabledPaths: (domain: Domain, path: Path) => Promise<Set<string>>
  disablePath: (domain: Domain, path: Path) => Promise<void>
  enablePath: (domain: Domain, path: Path) => Promise<void>
  togglePath: (domain: Domain, path: Path) => Promise<boolean>
  onDisabledBindingPathRemoved$: Observable<unknown>
  onDisabledBindingPathAdded$: Observable<unknown>
}

function toSet(docs: DisabledBindingPathDoc[]) {
  return new Set(docs.map((doc) => doc.domain_path))
}

function toPayload(domain: Domain, path: Path): DisabledPathPayload {
  return {
    domain: domain.value,
    path: path.value,
  }
}

export class DisabledPathsChannelImpl implements DisabledPathsChannel {
  public onDisabledBindingPathRemoved$ =
    disabledPathsMessages.onDisabledBindingPathRemoved.stream
  public onDisabledBindingPathAdded$ =
    disabledPathsMessages.onDisabledBindingPathAdded.stream

  async getAllDisabledPaths() {
    return disabledPathsMessages.getAllDisabledPaths.ask().then(toSet)
  }

  async queryDisabledPaths(domain: Domain, path: Path) {
    return disabledPathsMessages.queryDisabledPaths
      .ask({
        domain: domain.value,
        path: path.value,
      })
      .then(toSet)
  }
  async disablePath(domain: Domain, path: Path) {
    return disabledPathsMessages.disablePath
      .ask(toPayload(domain, path))
      .then(throwOnResponseError)
  }
  async enablePath(domain: Domain, path: Path) {
    return disabledPathsMessages.enablePath
      .ask(toPayload(domain, path))
      .then(throwOnResponseError)
  }
  async togglePath(domain: Domain, path: Path): Promise<boolean> {
    return disabledPathsMessages.togglePath
      .ask(toPayload(domain, path))
      .then(throwOnResponseError<boolean>)
  }
}

export class MemoryDisabledPathsChannelImpl implements DisabledPathsChannel {
  private toString(domain: Domain, path: Path): string {
    return domain.join(path)
  }

  private disabledBindingPathRemoved$ = new Subject()
  private disabledBindingPathAdded$ = new Subject()
  public onDisabledBindingPathRemoved$ =
    this.disabledBindingPathRemoved$.asObservable()
  public onDisabledBindingPathAdded$ =
    this.disabledBindingPathAdded$.asObservable()

  private paths = new Set<string>()

  async getAllDisabledPaths() {
    return this.paths
  }

  async queryDisabledPaths(domain: Domain, path: Path) {
    // TODO
    return this.paths
  }
  async disablePath(domain: Domain, path: Path) {
    this.paths.add(this.toString(domain, path))
    this.disabledBindingPathAdded$.next(null)
  }
  async enablePath(domain: Domain, path: Path) {
    this.paths.delete(this.toString(domain, path))
    this.disabledBindingPathRemoved$.next(null)
  }
  async togglePath(domain: Domain, path: Path): Promise<boolean> {
    const p = this.toString(domain, path)
    if (this.paths.has(p)) {
      this.enablePath(domain, path)
      return true
    } else {
      this.disablePath(domain, path)
      return false
    }
  }
}

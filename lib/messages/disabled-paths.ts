import { disabledPathsMessages, type DisabledPathPayload } from '~messages/storage'
import type { DisabledBindingPathDoc } from '~background/storage/db'
import { Domain, Path, urlFromParts } from '../url'
import { throwOnResponseError } from '.'

export interface DisabledPathsChannel {
  getAllDisabledPaths: () => Promise<Set<string>>
  queryDisabledPaths: (domain: Domain, path: Path) => Promise<Set<string>>
  disablePath: (domain: Domain, path: Path) => Promise<void>
  enablePath: (domain: Domain, path: Path) => Promise<void>
  togglePath: (domain: Domain, path: Path) => Promise<void>
}

function toSet (docs: DisabledBindingPathDoc[]) {
  return new Set(docs.map(doc => doc.domain_path))
}

function toPayload (domain: Domain, path: Path): DisabledPathPayload {
  return {
    domain: domain.value,
    path: path.value
  }
}

export class DisabledPathsChannelImpl implements DisabledPathsChannel {
  public onDisabledBindingPathRemoved$ = disabledPathsMessages.onDisabledBindingPathRemoved.stream
  public onDisabledBindingPathAdded$ = disabledPathsMessages.onDisabledBindingPathAdded.stream

  async getAllDisabledPaths () {
    return disabledPathsMessages.getAllDisabledPaths.ask().then(toSet)
  }

  async queryDisabledPaths (domain: Domain, path: Path) {
    return disabledPathsMessages.queryDisabledPaths.ask({
      domain: domain.value,
      path: path.value
    }).then(toSet)
  }
  async disablePath (domain: Domain, path: Path) {
    return disabledPathsMessages.disablePath.ask(toPayload(domain, path)).then(throwOnResponseError)
  }
  async enablePath (domain: Domain, path: Path) {
    return disabledPathsMessages.enablePath.ask(toPayload(domain, path)).then(throwOnResponseError)
  }
  async togglePath (domain: Domain, path: Path) {
    return disabledPathsMessages.togglePath.ask(toPayload(domain, path)).then(throwOnResponseError)
  }
}
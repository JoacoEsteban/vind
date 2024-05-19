import { Array, Record, String, type Static, Number } from 'runtypes'
import { toBindingDoc, type BindingChannel, fromManyBindingDoc } from './messages/bindings'
import { type DisabledPathsChannel } from './messages/disabled-paths'
import type { BindingDoc } from '~background/storage/db'
import { Err } from 'ts-results'
import { wrapResult, wrapResultAsync } from './control-flow'
import { ImportedResourceVersionError, InvalidImportedJSONError } from './error'
import semver from 'semver'
import { getExtensionVersion } from './misc'
import { Domain, Path } from './url'

const BindingPayload = Record({
  id: String,
  domain: String,
  path: String,
  key: String,
  selector: String
})
type BindingPayload = Static<typeof BindingPayload>

const DisabledPathPayload = String
type DisabledPathPayload = Static<typeof DisabledPathPayload>

const ResourcePayload = Record({
  bindings: Array(BindingPayload),
  disabledPaths: Array(DisabledPathPayload).optional(),
  vindVersion: String.withConstraint(version => semver.valid(version) !== null)
})
type ResourcePayload = Static<typeof ResourcePayload>

export class ResourceMigrator {
  constructor(
    private bindingChannel: BindingChannel,
    private disabledPathsChannel: DisabledPathsChannel
  ) {}

  async exportAllResources () {
    return wrapResultAsync(async () => {
      const [
        bindings,
        disabledPaths,
      ] = await Promise.all([
        this.bindingChannel.getAllBindings().then(bindings => bindings.map(toBindingDoc)),
        this.disabledPathsChannel.getAllDisabledPaths()
      ])

      return this.exportResources(bindings, disabledPaths)
    })
  }

  exportResources (bindings: BindingDoc[], disabledPaths: Set<string>) {
    return JSON.stringify(ResourcePayload.check({
      bindings,
      disabledPaths: [...disabledPaths.values()],
      vindVersion: getExtensionVersion()
    } as ResourcePayload), null, 2)
  }

  parsePayload (json: string): ResourcePayload {
    return ResourcePayload.check(JSON.parse(json))
  }

  async importResources (json: string) {
    const { err, val } = wrapResult(() => this.parsePayload(json))

    if (err) return Err(new InvalidImportedJSONError())

    const { bindings, disabledPaths = [], vindVersion: resourceVersion } = val
    const extensionVersion = getExtensionVersion()

    const [majorResourceVersion, majorExtensionVersion] = [resourceVersion, extensionVersion].map((v) => semver.major(v))

    if (majorResourceVersion > majorExtensionVersion) { // TODO implement version handling migration
      return Err(new ImportedResourceVersionError(resourceVersion, extensionVersion))
    }

    return wrapResultAsync(() => Promise.all([
      ...fromManyBindingDoc(bindings).map(this.bindingChannel.upsertBinding),
      ...disabledPaths.map(domain_path => this.disabledPathsChannel.disablePath(new Domain(domain_path), new Path(domain_path)))
    ]))
  }
}
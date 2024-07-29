import { toBindingDoc, type BindingChannel, fromManyBindingDoc } from './messages/bindings'
import { type DisabledPathsChannel } from './messages/disabled-paths'
import { type BindingDoc } from '~background/storage/db'
import { Err } from 'ts-results'
import { wrapResult, wrapResultAsync } from './control-flow'
import { ImportedResourceVersionError, InvalidImportedJSONError } from './error'
import semver from 'semver'
import { getExtensionVersion } from './misc'
import { Domain, Path } from './url'
import { ResourceParser, type ResourcePayload } from './resource-parser'
import { SERIALIZATION_JSON_INDENT, SERIALIZATION_MINIFY } from './env'

export class ResourceMigrator {
  private parser = new ResourceParser(getExtensionVersion(), SERIALIZATION_JSON_INDENT, SERIALIZATION_MINIFY)

  constructor(
    private bindingChannel: BindingChannel,
    private disabledPathsChannel: DisabledPathsChannel
  ) {
  }

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
    return this.parser.serialize({
      bindings,
      disabledPaths: [...disabledPaths.values()],
      vindVersion: getExtensionVersion(),
    })
  }

  parsePayload (json: string): ResourcePayload {
    return this.parser.parse(JSON.parse(json))
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

  async wipeResources () {
    return wrapResultAsync(async () => {
      await Promise.all([
        this.bindingChannel.deleteAllBindings(),
      ])
    })
  }
}
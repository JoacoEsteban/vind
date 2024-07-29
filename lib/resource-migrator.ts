import { z } from 'zod'
import { toBindingDoc, type BindingChannel, fromManyBindingDoc } from './messages/bindings'
import { type DisabledPathsChannel } from './messages/disabled-paths'
import { type SerializableXpathObject, type BindingDoc, type SerializableParentXpathObject, type SerializableChildXpathObject } from '~background/storage/db'
import { Err } from 'ts-results'
import { wrapResult, wrapResultAsync } from './control-flow'
import { ImportedResourceVersionError, InvalidImportedJSONError } from './error'
import semver from 'semver'
import { getExtensionVersion } from './misc'
import { Domain, Path } from './url'

const SerializableXpathObject: z.ZodType<SerializableXpathObject> = z.lazy(() =>
  z.object({
    tagName: z.string(),
    attrs: z.array(z.tuple([z.string(), z.array(z.string())])),
    parent: z.union([z.lazy(() => SerializableParentXpathObject), z.null()]),
    children: z.union([z.array(z.lazy(() => SerializableChildXpathObject)), z.null()]),
  })
)

const SerializableParentXpathObject: z.ZodType<SerializableParentXpathObject> = z.lazy(() =>
  z.object({
    tagName: z.string(),
    attrs: z.array(z.tuple([z.string(), z.array(z.string())])),
    parent: z.union([z.lazy(() => SerializableParentXpathObject), z.null()]),
    children: z.null(),
  })
)

const SerializableChildXpathObject: z.ZodType<SerializableChildXpathObject> = z.lazy(() =>
  z.object({
    tagName: z.string(),
    attrs: z.array(z.tuple([z.string(), z.array(z.string())])),
    parent: z.null(),
    children: z.union([z.array(z.lazy(() => SerializableChildXpathObject)), z.null()]),
  })
)

const BindingPayload = z.object({
  id: z.string(),
  domain: z.string(),
  path: z.string(),
  key: z.string(),
  selector: z.string(),
  xpathObject: z.union([SerializableXpathObject, z.null()]),
})

type BindingPayload = z.infer<typeof BindingPayload>

const DisabledPathPayload = z.string()
type DisabledPathPayload = z.infer<typeof DisabledPathPayload>

const ResourcePayload = z.object({
  bindings: z.array(BindingPayload),
  disabledPaths: z.array(DisabledPathPayload).optional(),
  vindVersion: z.string().refine(version => semver.valid(version) !== null, {
    message: "Invalid semver version",
  }),
})

type ResourcePayload = z.infer<typeof ResourcePayload>
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
    return JSON.stringify(ResourcePayload.parse({
      bindings,
      disabledPaths: [...disabledPaths.values()],
      vindVersion: getExtensionVersion()
    } as ResourcePayload), null, 2)
  }

  parsePayload (json: string): ResourcePayload {
    return ResourcePayload.parse(JSON.parse(json))
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
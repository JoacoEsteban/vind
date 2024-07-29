import { z, ZodEffects, ZodType, type ZodTypeDef } from 'zod'
import { type SerializableXPathObject, type SerializableParentXPathObject, type SerializableChildXPathObject } from '~background/storage/db'
import semver from 'semver'
import { match } from 'ts-pattern'

export type SerializableXPathObjectMinified = {
  t: SerializableXPathObject["tagName"]
  a: SerializableXPathObject["attrs"]
  p: SerializableParentXPathObjectMinified | null // SerializableXPathObject["parent"]
  c: SerializableChildXPathObjectMinified[] | null // SerializableXPathObject["children"]
}
export type SerializableParentXPathObjectMinified = Omit<SerializableXPathObjectMinified, "c">
export type SerializableChildXPathObjectMinified = Omit<SerializableXPathObjectMinified, "p">

const SerializableXPathObject: z.ZodType<SerializableXPathObject> = z.lazy(() =>
  z.object({
    tagName: z.string(),
    attrs: z.array(z.tuple([z.string(), z.array(z.string())])),
    parent: z.union([z.lazy(() => SerializableParentXPathObject), z.null()]),
    children: z.union([z.array(z.lazy(() => SerializableChildXPathObject)), z.null()]),
  })
)

const SerializableParentXPathObject: z.ZodType<SerializableParentXPathObject> = z.lazy(() =>
  z.object({
    tagName: z.string(),
    attrs: z.array(z.tuple([z.string(), z.array(z.string())])),
    parent: z.union([z.lazy(() => SerializableParentXPathObject), z.null()]),
    children: z.null(),
  })
)

const SerializableChildXPathObject: z.ZodType<SerializableChildXPathObject> = z.lazy(() =>
  z.object({
    tagName: z.string(),
    attrs: z.array(z.tuple([z.string(), z.array(z.string())])),
    parent: z.null(),
    children: z.union([z.array(z.lazy(() => SerializableChildXPathObject)), z.null()]),
  })
)

const SerializableXPathObjectMinified: z.ZodType<SerializableXPathObjectMinified> = z.lazy(() =>
  z.object({
    t: z.string(),
    a: z.array(z.tuple([z.string(), z.array(z.string())])),
    p: z.union([SerializableParentXPathObjectMinified, z.null()]),
    c: z.union([z.array(SerializableChildXPathObjectMinified), z.null()]),
  })
)

const SerializableParentXPathObjectMinified: z.ZodType<SerializableParentXPathObjectMinified> = z.lazy(() =>
  z.object({
    t: z.string(),
    a: z.array(z.tuple([z.string(), z.array(z.string())])),
    p: z.union([SerializableParentXPathObjectMinified, z.null()]),
  })
)

const SerializableChildXPathObjectMinified: z.ZodType<SerializableChildXPathObjectMinified> = z.lazy(() =>
  z.object({
    t: z.string(),
    a: z.array(z.tuple([z.string(), z.array(z.string())])),
    c: z.union([z.array(SerializableChildXPathObjectMinified), z.null()]),
  })
)

const BindingPayload = z.object({
  id: z.string(),
  domain: z.string(),
  path: z.string(),
  key: z.string(),
  selector: z.string(),
  xpathObject: z.optional(z.union([SerializableXPathObject, z.null()])),
})

const BindingPayloadMinified = z.object({
  i: z.string(),
  d: z.string(),
  p: z.string(),
  k: z.string(),
  s: z.string(),
  x: z.union([SerializableXPathObjectMinified, z.null()]),
})

export type BindingPayload = z.infer<typeof BindingPayload>

const DisabledPathPayload = z.string()
export type DisabledPathPayload = z.infer<typeof DisabledPathPayload>

const vindVersion = z.string().refine(version => semver.valid(version) !== null, {
  message: "Invalid semver version",
})

const ResourcePayload = z.object({
  bindings: z.array(BindingPayload),
  disabledPaths: z.array(DisabledPathPayload).optional(),
  vindVersion,
})
const ResourcePayloadMinified = z.object({
  bindings: z.array(BindingPayloadMinified),
  disabledPaths: z.array(DisabledPathPayload).optional(),
  vindVersion,
})

export type ResourcePayloadMinified = z.infer<typeof ResourcePayloadMinified>

const versionParser = z.object({
  vindVersion
})

export type ResourcePayload = z.infer<typeof ResourcePayload>

const ResourcePayloadMinifiedExpander: ZodEffects<typeof ResourcePayloadMinified, ResourcePayload> = ResourcePayloadMinified.transform((minified) => {
  return {
    bindings: minified.bindings.map(b => expandBinding.parse(b)),
    disabledPaths: minified.disabledPaths,
    vindVersion: minified.vindVersion,
  }
})

const ResourcePayloadMinifier: ZodEffects<typeof ResourcePayload, ResourcePayloadMinified> = ResourcePayload.transform((payload) => {
  return {
    bindings: payload.bindings.map(b => minifyBinding.parse(b)),
    disabledPaths: payload.disabledPaths,
    vindVersion: payload.vindVersion,
  }
})

const expandBinding = BindingPayloadMinified.transform<BindingPayload>((minified) => {
  return {
    id: minified.i,
    domain: minified.d,
    key: minified.k,
    path: minified.p,
    selector: minified.s,
    xpathObject: minified.x ? expandXPathObject.parse(minified.x) : null,
  }
})

export type BindingPayloadMinified = z.infer<typeof BindingPayloadMinified>

const minifyBinding = BindingPayload.transform<BindingPayloadMinified>((payload) => {
  return {
    i: payload.id,
    d: payload.domain,
    k: payload.key,
    p: payload.path,
    s: payload.selector,
    x: payload.xpathObject ? minifyXPathObject.parse(payload.xpathObject) : null,
  }
})

const minifyXPathObject = SerializableXPathObject.transform<SerializableXPathObjectMinified>((expanded) => {
  return {
    t: expanded.tagName,
    a: expanded.attrs,
    p: expanded.parent ? minifyParentXPathObject.parse(expanded.parent) : null,
    c: expanded.children ? expanded.children.map(c => minifyChildXPathObject.parse(c)) : null,
  }
})

const minifyParentXPathObject: ZodEffects<typeof SerializableParentXPathObject, SerializableParentXPathObjectMinified> = SerializableParentXPathObject.transform<SerializableParentXPathObjectMinified>((expanded) => {
  return {
    t: expanded.tagName,
    a: expanded.attrs,
    p: expanded.parent ? minifyParentXPathObject.parse(expanded.parent) : null,
  }
})

const minifyChildXPathObject: ZodEffects<typeof SerializableChildXPathObject, SerializableChildXPathObjectMinified> = SerializableChildXPathObject.transform((expanded) => {
  return {
    t: expanded.tagName,
    a: expanded.attrs,
    c: expanded.children ? expanded.children.map(c => minifyChildXPathObject.parse(c)) : null,
  }
})

const expandXPathObject = SerializableXPathObjectMinified.transform<SerializableXPathObject>((minified) => {
  return {
    tagName: minified.t,
    attrs: minified.a,
    parent: minified.p ? expandParentXPathObject.parse(minified.p) : null,
    children: minified.c ? minified.c.map(c => expandChildXPathObject.parse(c)) : null,
  }
})

const expandParentXPathObject: ZodEffects<typeof SerializableParentXPathObjectMinified, SerializableParentXPathObject> = SerializableParentXPathObjectMinified.transform((minified) => {
  return {
    tagName: minified.t,
    attrs: minified.a,
    parent: minified.p ? expandParentXPathObject.parse(minified.p) : null,
    children: null,
  }
})

const expandChildXPathObject: ZodEffects<typeof SerializableChildXPathObjectMinified, SerializableChildXPathObject> = SerializableChildXPathObjectMinified.transform((minified) => {
  return {
    tagName: minified.t,
    attrs: minified.a,
    parent: null,
    children: minified.c ? minified.c.map(c => expandChildXPathObject.parse(c)) : null,
  }
})

export class ResourceParser {
  constructor(
    readonly version: string,
    readonly indent: number = 2,
    readonly minify: boolean = true,
  ) {
    if (semver.valid(version) === null) {
      throw new Error("Invalid version")
    }
  }

  parse (payload: any): ResourcePayload {
    const version = versionParser.safeParse(payload)

    if (version.error) {
      throw new Error("Invalid version")
    }

    const parser = this.getParserForVersion(version.data.vindVersion)
    const res = parser.safeParse(payload)

    if (res.error) {
      throw new Error("Invalid payload")
    }

    return res.data
  }

  serialize (payload: ResourcePayload): string {
    const parser = this.getSerializerForVersion(this.version)
    return JSON.stringify(parser.parse(payload), null, this.indent)
  }

  getParserForVersion (version: string): ZodType<ResourcePayload, ZodTypeDef, any> {
    return match(version)
      .when((v) => semver.gte(v, "3.0.0"), () =>
        match(this.minify)
          .with(true, () => ResourcePayloadMinifiedExpander)
          .otherwise(() => ResourcePayload)
      )
      .otherwise(() => ResourcePayload)
  }

  getSerializerForVersion (version: string): ZodType<any, ZodTypeDef, any> {
    return match(version)
      .when((v) => semver.gte(v, "3.0.0"), () =>
        match(this.minify)
          .with(true, () => ResourcePayloadMinifier)
          .otherwise(() => ResourcePayload)
      )
      .otherwise(() => ResourcePayload)
  }
}
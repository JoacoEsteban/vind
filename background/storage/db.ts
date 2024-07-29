import Dexie from 'dexie'

export type SerializableXpathObject = {
  tagName: string,
  attrs: [string, string[]][],
  parent: SerializableParentXpathObject | null,
  children: SerializableChildXpathObject[] | null,
}

export type SerializableParentXpathObject = SerializableXpathObject & { children: null }
export type SerializableChildXpathObject = SerializableXpathObject & { parent: null }

export type BindingDoc = {
  id: string
  domain: string
  path: string
  key: string
  selector: string
  xpathObject?: SerializableXpathObject | null
}

export type DisabledBindingPathDoc = {
  domain_path: string
}
export class VindDB extends Dexie {
  bindings: Dexie.Table<BindingDoc, string>
  disabledBindingPaths: Dexie.Table<DisabledBindingPathDoc>

  constructor() {
    super('vind-db')
    // debugger
    this.version(2).stores({
      bindings: 'id, *domain, path, key, selector', // TODO turn domain into simple index
      pageOverrides: '++id, *overrides_domain_path, bindings_path'
    })


    this.version(3).stores({
      pageOverrides: null,
      disabledBindingPaths: '&domain_path',
    })

    this.version(4).stores({
      bindings: 'id, [domain+path], key, selector',
    })

    this.version(5).stores({
      bindings: 'id, [domain+path], key, selector, xpathObject',
    })

    this.bindings = this.table('bindings')
    this.disabledBindingPaths = this.table('disabledBindingPaths')
  }
}
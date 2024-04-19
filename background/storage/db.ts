import Dexie from 'dexie'

export type BindingDoc = {
  id: string
  domain: string
  path: string
  key: string
  selector: string
}

export type PageOverrideDoc = {
  id: number
  overrides_domain_path: string
  bindings_path: string
}

export type PageOverrideInsertType = Omit<PageOverrideDoc, 'id'>

export class VindDB extends Dexie {
  bindings: Dexie.Table<BindingDoc, string>
  pageOverrides: Dexie.Table<PageOverrideDoc, number, PageOverrideInsertType>

  constructor() {
    super('vind-db')
    // debugger
    this.version(2).stores({
      bindings: 'id, *domain, path, key, selector',
      pageOverrides: '++id, *overrides_domain_path, bindings_path'
    })

    this.bindings = this.table('bindings')
    this.pageOverrides = this.table<PageOverrideDoc, number>('pageOverrides')
  }
}
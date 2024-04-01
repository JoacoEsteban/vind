import Dexie from 'dexie'

export type BindingDoc = {
  id: string
  domain: string
  path: string
  key: string
  selector: string
}

export class VindDB extends Dexie {
  bindings: Dexie.Table<BindingDoc, string>

  constructor() {
    super('vind-db')
    this.version(1).stores({
      bindings: 'id, *domain, path, key, selector',
    })

    this.bindings = this.table('bindings')
  }
}
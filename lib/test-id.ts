import { stringToHash } from './id'

export class TestId {
  readonly id: string
  constructor(readonly name: string) {
    this.id = stringToHash(name).toString()
  }
}

export const BindButtonId = new TestId('bind-button')
export const BindingButtonId = (key: string) =>
  new TestId(`binding-button-key:${key}`)

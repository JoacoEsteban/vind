import { stringToHash } from './id'
import type { NotificationSettingKey } from './notification-settings'
import { RegistrationState } from './registration-controller'

export class TestId<Name extends string | number = string | number> {
  readonly id: string
  constructor(readonly name: Name) {
    this.id = stringToHash(String(name)).toString()
  }

  static factory<Prefix extends `${string}:`>(prefix: Prefix) {
    return <Name extends string | number>(): new (
      name: Name,
    ) => TestId<`${Prefix}${Name}`> => {
      return class extends TestId<`${Prefix}${Name}`> {
        constructor(name: Name) {
          super(`${prefix}${name}`)
        }
      }
    }
  }
}

export const BindButtonId = new TestId('bind-button')
export const BindingButtonId = TestId.factory(`binding-button-key:`)<string>()
export const OverlayId = new TestId('vind-overlay')
export const OpenOptionsButtonId = new TestId('open-options-button')
export const bindingActivatedNotificationId = new TestId(
  'binding-activated-notification',
)

export const RegistrationNotificationToastId = TestId.factory(
  'registration-notification-toast:',
)<'loading' | 'success' | 'aborted' | 'failedKnown' | 'failedUnknown'>()
export const RegistrationStateId = TestId.factory(
  'registration-state:',
)<RegistrationState>()
export const OptionsTabsId = TestId.factory('options-tabs:')<
  'bindings' | 'migrator' | 'notifications'
>()
export const NotificationToggleButtonId = TestId.factory(
  `notification-toggle-button-key:`,
)<NotificationSettingKey>()

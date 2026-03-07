import { keysToIdentityEnum, mapKeysToStaticValue } from './enum'

export const notificationSettingKeyList = [
  'bindingActivated',
  'inexistentElementError',
] as const
export const notificationSettingKeys = keysToIdentityEnum(
  notificationSettingKeyList,
)

export type NotificationSettingKey =
  (typeof notificationSettingKeys)[keyof typeof notificationSettingKeys]

export const defaultNotificationSettings: Readonly<
  Record<NotificationSettingKey, boolean>
> = Object.freeze(mapKeysToStaticValue(notificationSettingKeyList, true))

export function createDefaultNotificationSettings() {
  return { ...defaultNotificationSettings }
}

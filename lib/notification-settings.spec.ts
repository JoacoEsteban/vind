import { expect, test } from '@playwright/test'
import {
  defaultNotificationSettings,
  notificationSettingKeys,
} from './notification-settings'

test('default notification settings are immutable', () => {
  expect(Object.isFrozen(defaultNotificationSettings)).toBe(true)

  const changed = Reflect.set(
    defaultNotificationSettings,
    notificationSettingKeys.bindingActivated,
    false,
  )

  expect(changed).toBe(false)
  expect(
    defaultNotificationSettings[notificationSettingKeys.bindingActivated],
  ).toBe(true)
})

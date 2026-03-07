import type { NotificationSettingDoc } from '~background/storage/db'
import { Subject, type Observable } from 'rxjs'
import {
  createDefaultNotificationSettings,
  notificationSettingKeyList,
  type NotificationSettingKey,
  defaultNotificationSettings,
} from '~lib/notification-settings'
import { notificationSettingsMessages } from '~messages/storage'
import { throwOnResponseError } from '.'
import { entries } from '~lib/object'

export interface NotificationSettingsChannel {
  getAllSettings: () => Promise<
    Map<NotificationSettingKey, { enabled: boolean }>
  >
  setSetting: (key: NotificationSettingKey, enabled: boolean) => Promise<void>
  restoreDefaults: () => Promise<void>
  onNotificationSettingUpdated$: Observable<unknown>
}

function toMap(
  docs: NotificationSettingDoc[],
): Map<NotificationSettingKey, { enabled: boolean }> {
  return new Map(docs.map(({ key, enabled }) => [key, { enabled }]))
}

export class NotificationSettingsChannelImpl
  implements NotificationSettingsChannel
{
  public onNotificationSettingUpdated$ =
    notificationSettingsMessages.onNotificationSettingUpdated.stream

  async getAllSettings() {
    return notificationSettingsMessages.getAllSettings.ask().then(toMap)
  }

  async setSetting(key: NotificationSettingKey, enabled: boolean) {
    return notificationSettingsMessages.setSetting
      .ask({ key, enabled })
      .then(throwOnResponseError)
  }

  async restoreDefaults() {
    return notificationSettingsMessages.restoreDefaults
      .ask()
      .then(throwOnResponseError)
  }
}

export class MemoryNotificationSettingsChannelImpl
  implements NotificationSettingsChannel
{
  private readonly settingsMap = new Map<
    NotificationSettingKey,
    { enabled: boolean }
  >(
    entries(defaultNotificationSettings).map(([key, enabled]) => [
      key,
      { enabled },
    ]),
  )

  onNotificationSettingUpdated$$ = new Subject<unknown>()
  onNotificationSettingUpdated$ =
    this.onNotificationSettingUpdated$$.asObservable()

  getAllSettings(): Promise<Map<NotificationSettingKey, { enabled: boolean }>> {
    return Promise.resolve(this.settingsMap)
  }

  setSetting(key: NotificationSettingKey, enabled: boolean): Promise<void> {
    this.settingsMap.set(key, { enabled })
    this.onNotificationSettingUpdated$$.next(null)
    return Promise.resolve()
  }

  restoreDefaults(): Promise<void> {
    entries(defaultNotificationSettings).forEach(([key, enabled]) => {
      this.setSetting(key as NotificationSettingKey, enabled)
    })
    this.onNotificationSettingUpdated$$.next(null)
    return Promise.resolve()
  }
}

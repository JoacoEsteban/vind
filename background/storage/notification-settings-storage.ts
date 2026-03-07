import { Observable, Subject } from 'rxjs'
import { log } from '~lib/log'
import {
  defaultNotificationSettings,
  notificationSettingKeyList,
  type NotificationSettingKey,
} from '~lib/notification-settings'
import type { NotificationSettingDoc, VindDB } from './db'
import { notNull } from '~lib/misc'

export interface NotificationSettingsStorage {
  getAllSettings: () => Promise<NotificationSettingDoc[]>
  setSetting: (key: NotificationSettingKey, enabled: boolean) => Promise<void>
  restoreDefaults: () => Promise<void>
  onUpdated$: Observable<NotificationSettingDoc>
}

export class NotificationSettingsStorageImpl
  implements NotificationSettingsStorage
{
  private collection: typeof VindDB.prototype.notificationSettings
  private onUpdatedSubject = new Subject<NotificationSettingDoc>()
  public onUpdated$ = this.onUpdatedSubject.asObservable()

  constructor(private db: VindDB) {
    this.collection = db.notificationSettings

    this.collection.hook(
      'updating',
      (modifications, primKey, obj, transaction) => {
        log.info('Updating notification setting', {
          modifications,
          primKey,
          obj,
          transaction,
        })
        transaction.on('complete', () => {
          const maybeEnabled = (
            modifications as Partial<NotificationSettingDoc>
          ).enabled
          const nextSetting: NotificationSettingDoc = {
            key: obj.key,
            enabled:
              typeof maybeEnabled === 'boolean' ? maybeEnabled : obj.enabled,
          }
          this.onUpdatedSubject.next(nextSetting)
        })
      },
    )

    this.collection.hook('creating', (primKey, obj, transaction) => {
      log.info('Creating notification setting', { primKey, obj, transaction })
      transaction.on('complete', () => this.onUpdatedSubject.next(obj))
    })
  }

  async getAllSettings(): Promise<NotificationSettingDoc[]> {
    await this.ensureDefaults()
    return this.collection.toArray()
  }

  async setSetting(
    key: NotificationSettingKey,
    enabled: boolean,
  ): Promise<void> {
    await this.collection.put({ key, enabled })
  }

  async restoreDefaults(): Promise<void> {
    const docs = notificationSettingKeyList.map((key) => ({
      key,
      enabled: defaultNotificationSettings[key],
    }))

    await this.db.transaction('rw', this.collection, async () => {
      await this.collection.bulkPut(docs)
    })
  }

  private async ensureDefaults() {
    await this.db.transaction('rw', this.collection, async () => {
      const currentDocKeys = (
        await this.collection.bulkGet([...notificationSettingKeyList])
      )
        .filter(notNull)
        .map((doc) => doc.key)

      const docs = notificationSettingKeyList
        .filter((key) => !currentDocKeys.includes(key))
        .map((key) => ({
          key,
          enabled: defaultNotificationSettings[key],
        }))

      await this.collection.bulkPut(docs)
    })
  }
}

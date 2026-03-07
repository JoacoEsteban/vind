<script lang="ts">
  import { onDestroy } from 'svelte'
  import toast from 'svelte-french-toast/dist'
  import Button from '~components/button.svelte'
  import Toggle from '~components/toggle.svelte'
  import {
    notificationSettingKeys,
    type NotificationSettingKey,
  } from '~lib/notification-settings'
  import type { PageController } from '~lib/page-controller'
  import {
    EMPTY,
    from,
    startWith,
    Subject,
    switchMap,
    withLatestFrom,
  } from 'rxjs'
  import { DisposeBag } from '~lib/dispose-bag'
  import { log } from '~lib/log'
  import { match } from '~node_modules/ts-pattern/dist'

  export let pageController: PageController
  const { sink, dispose } = new DisposeBag()
  onDestroy(dispose)

  let notificationSettings = pageController.notificationSettings$.pipe(
    startWith(new Map()),
  )

  const toggleNotificationSetting$$ = new Subject<NotificationSettingKey>()

  toggleNotificationSetting$$
    .pipe(
      withLatestFrom(notificationSettings),
      switchMap(([key, notifications]) =>
        match(notifications?.get(key) ?? null)
          .with(null, () => {
            log.warn(
              `Tried to toggle a notification "${key}" setting that was either unset or settings didn't load yet`,
            )
            return EMPTY
          })
          .otherwise(({ enabled }) =>
            from(
              pageController.notificationSettingsChannel.setSetting(
                key,
                !enabled,
              ),
            ),
          ),
      ),
      sink(),
    )
    .subscribe()

  async function restoreDefaults() {
    await pageController.notificationSettingsChannel
      .restoreDefaults()
      .then(() => toast.success('Notification settings restored'))
      .catch(() => toast.error('Could not restore notification settings'))
  }
</script>

<div class="py-4">
  <div class="flex items-center justify-between gap-3">
    <h2 class="font-bold made-tommy">Notifications</h2>
    <Button icon="arrowClockwise" opaque on:click={restoreDefaults}>
      Restore defaults
    </Button>
  </div>
  <h3 class="mt-3 mb-2">Bindings</h3>
  <div class="flex items-center justify-between gap-3">
    <div>
      <h5 class="m-0">Binding activated</h5>
      <p class="m-0">Show a toast when a binding is triggered.</p>
    </div>
    <Toggle
      checked={$notificationSettings.get(
        notificationSettingKeys.bindingActivated,
      )?.enabled}
      on:click={() =>
        toggleNotificationSetting$$.next(
          notificationSettingKeys.bindingActivated,
        )} />
  </div>

  <h3 class="mt-4 mb-2">Errors</h3>
  <div class="flex items-center justify-between gap-3">
    <div>
      <h5 class="m-0">Missing target element</h5>
      <p class="m-0">
        Show an error toast when a binding target no longer exists on the page.
      </p>
    </div>
    <Toggle
      checked={$notificationSettings.get(
        notificationSettingKeys.inexistentElementError,
      )?.enabled}
      on:click={() =>
        toggleNotificationSetting$$.next(
          notificationSettingKeys.inexistentElementError,
        )} />
  </div>
</div>

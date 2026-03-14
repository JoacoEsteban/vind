import '@virtualstate/navigation/polyfill'
import {
  Subject,
  filter,
  fromEvent,
  merge,
  pairwise,
  startWith,
  throttleTime,
  withLatestFrom,
} from 'rxjs'
import toast from 'svelte-french-toast/dist'
import { match } from 'ts-pattern'
import { registrationStateToastOptions } from '~lib/definitions'
import {
  InexistentElementError,
  RegistrationAbortedError,
  UnexpectedError,
  VindError,
} from '~lib/error'
import { log } from '~lib/log'
import { BindingChannelImpl } from '~lib/messages/bindings'
import { DisabledPathsChannelImpl } from '~lib/messages/disabled-paths'
import { NotificationSettingsChannelImpl } from '~lib/messages/notification-settings'
import { notificationSettingKeys } from '~lib/notification-settings'
import { PageController } from '~lib/page-controller'
import { RegistrationController } from '~lib/registration-controller'
import { Path, getSanitizedCurrentUrl } from '~lib/url'
import { wakeUp } from '~messages/tabs'
import {
  CrossFrameEventsController,
  VindKeyboardEvent,
} from '~lib/cross-frame-keyboard-events'
import {
  RegistrationNotificationToastId,
  RegistrationStateId,
  TestId,
  bindingActivatedNotificationId,
} from '~lib/test-id'
import { Render } from '~lib/test-id-svelte'
const isIframe = window.self !== window.top

const registrationNotificationIds = {
  loading: new RegistrationNotificationToastId('loading'),
  success: new RegistrationNotificationToastId('success'),
  aborted: new RegistrationNotificationToastId('aborted'),
  failedKnown: new RegistrationNotificationToastId('failedKnown'),
  failedUnknown: new RegistrationNotificationToastId('failedUnknown'),
}

export class DocumentClient {
  public readonly isIframe = isIframe

  constructor(
    private readonly keyboardEventsControllerInstance = new CrossFrameEventsController(
      isIframe,
    ),
    public readonly pageControllerInstance = new PageController(
      new BindingChannelImpl(),
      new DisabledPathsChannelImpl(),
      new NotificationSettingsChannelImpl(),
      'content-script',
      getSanitizedCurrentUrl(),
    ),
    public readonly registrationControllerInstance = new RegistrationController(
      pageControllerInstance,
      keyboardEventsControllerInstance,
    ),
    public readonly onPageControllerReady = pageControllerInstance
      .refreshResources()
      .then(() => pageControllerInstance),
  ) {
    if (isIframe) {
      return
    }

    const registrationStateToastSubject = new Subject<string | null>()
    registrationStateToastSubject
      .pipe(startWith(''), pairwise())
      .subscribe(([oldToast]) => {
        oldToast && toast.dismiss(oldToast)
      })

    this.registrationControllerInstance.registrationState$.subscribe(
      (state) => {
        const message = registrationStateToastOptions[state]
        const toastId =
          message &&
          toast(Render(message.text).withId(new RegistrationStateId(state)), {
            duration: Infinity,
            icon: message.icon,
          })

        registrationStateToastSubject.next(toastId)
      },
    )

    this.onPageControllerReady.then((instance) => {
      if (typeof window.navigation !== 'undefined') {
        // TODO validate polyfill works (firefox)
        window.navigation?.addEventListener('navigate', () =>
          setTimeout(() => {
            log.info('Navigation event', window.location.href)
            const url = getSanitizedCurrentUrl()
            instance.changeRoute(url)
          }),
        )
      }

      wakeUp.stream.subscribe(() => {
        log.info('Waking up, updating resources')
        instance.refreshResources()
      })

      merge(
        fromEvent<VindKeyboardEvent>(
          this.keyboardEventsControllerInstance,
          'keypress',
        ),
        fromEvent<VindKeyboardEvent>(
          this.keyboardEventsControllerInstance,
          'keydown',
        ),
      )
        .pipe(throttleTime(100))
        .pipe(
          filter(
            () => !registrationControllerInstance.isRegistrationInProgress(),
          ),
        )
        .pipe(filter((e) => !(e.metaKey || e.ctrlKey)))
        .subscribe(async (event) => {
          instance.onKeyPress(event)
        })

      instance.triggers$
        .pipe(withLatestFrom(this.pageControllerInstance.notificationSettings$))
        .subscribe(async ([trigger, notificationSettings]) => {
          trigger
            .then((presses) => {
              if (
                notificationSettings.get(
                  notificationSettingKeys.bindingActivated,
                )?.enabled
              ) {
                toast.success(
                  Render('Binding activated').withId(
                    bindingActivatedNotificationId,
                  ),
                  { duration: 500 },
                )
              }
            })
            .catch((err) => {
              log.error('Error in trigger', err)
              const message = match<Error, string | null>(err)
                .when(
                  () => err instanceof InexistentElementError,
                  () =>
                    match(
                      notificationSettings.get(
                        notificationSettingKeys.inexistentElementError,
                      )?.enabled,
                    )
                      .with(
                        true,
                        () =>
                          'The element that the binding is trying to target does not exist on this page. You can try binding it again',
                      )
                      .otherwise(() => null),
                )
                .when(
                  () => err instanceof VindError,
                  () => err.message,
                )
                .otherwise(() => 'An unknown error occurred')

              if (message) {
                toast.error(message, { duration: 5000 })
              }
            })
        })
    })
  }

  registerNewBinding(path?: Path) {
    if (this.registrationControllerInstance.isRegistrationInProgress()) {
      return
    }

    const site = this.pageControllerInstance.currentSiteSplitted()

    if (!site) {
      toast.error(new UnexpectedError().message)
      return
    }

    const { domain } = site
    path = path || site.path.inferPattern()

    const registration = this.registrationControllerInstance.register(
      domain,
      path,
    )

    const loadingToast = toast.loading(
      Render('Registering Binding. Press ESC to cancel.').withId(
        registrationNotificationIds.loading,
      ),
      { position: 'top-right' },
    )

    registration.then(() => {
      log.success('registering done')
      toast.success(
        Render('Binding registered').withId(
          registrationNotificationIds.success,
        ),
      )
    })

    registration.catch((err) => {
      log.error('registering failed', err)

      const [message, duration, testId] = match<
        Error,
        [string, number, TestId]
      >(err)
        .when(
          (err) => err instanceof RegistrationAbortedError,
          () => [
            'Registration aborted',
            1000,
            registrationNotificationIds.aborted,
          ],
        )
        .when(
          (err) => err instanceof VindError,
          (err: VindError) => [
            err.message,
            3000,
            registrationNotificationIds.failedKnown,
          ],
        )
        .otherwise(() => [
          'Failed to register binding',
          3000,
          registrationNotificationIds.failedUnknown,
        ])

      toast.error(Render(message).withId(testId), {
        duration,
      })
    })

    registration.finally(() => toast.dismiss(loadingToast))

    return registration
  }
}

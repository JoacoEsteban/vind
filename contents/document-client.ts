import '@virtualstate/navigation/polyfill'
import {
  Subject,
  filter,
  fromEvent,
  merge,
  pairwise,
  startWith,
  throttleTime,
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
import { PageController } from '~lib/page-controller'
import { RegistrationController } from '~lib/registration-controller'
import { Path, getSanitizedCurrentUrl } from '~lib/url'
import { wakeUp } from '~messages/tabs'
import {
  CrossFrameEventsController,
  VindKeyboardEvent,
} from '~lib/cross-frame-keyboard-events'
const isIframe = window.self !== window.top

export class DocumentClient {
  public readonly isIframe = isIframe

  constructor(
    private readonly keyboardEventsControllerInstance = new CrossFrameEventsController(
      isIframe,
    ),
    public readonly pageControllerInstance = new PageController(
      new BindingChannelImpl(),
      new DisabledPathsChannelImpl(),
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
          toast(message.text, {
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

      instance.triggers$.subscribe(async (trigger) => {
        trigger
          .then((presses) => {
            toast.success('Binding activated', { duration: 500 })
          })
          .catch((err) => {
            log.error('Error in trigger', err)
            const message = match<Error, string>(err)
              .when(
                () => err instanceof InexistentElementError,
                () =>
                  'The element that the binding is trying to target does not exist on this page. You can try binding it again',
              )
              .when(
                () => err instanceof VindError,
                () => err.message,
              )
              .otherwise(() => 'An unknown error occurred')
            toast.error(message, { duration: 5000 })
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
      'Registering Binding. Press ESC to cancel.',
      { position: 'top-right' },
    )

    registration.then(() => {
      log.success('registering done')
      toast.success('Binding registered')
    })

    registration.catch((err) => {
      log.error('registering failed', err)

      const [message, duration] = match<Error, [string, number]>(err)
        .when(
          (err) => err instanceof RegistrationAbortedError,
          () => ['Registration aborted', 1000],
        )
        .when(
          (err) => err instanceof VindError,
          (err: VindError) => [err.message, 3000],
        )
        .otherwise(() => ['Failed to register binding', 3000])

      toast.error(message, {
        duration,
      })
    })

    registration.finally(() => toast.dismiss(loadingToast))

    return registration
  }
}

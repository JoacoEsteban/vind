import "@virtualstate/navigation/polyfill"
import { filter, fromEvent, merge, throttleTime } from 'rxjs'
import toast from 'svelte-french-toast/dist'
import { match } from 'ts-pattern'
import { InexistentElementError, VindError } from '~lib/error'
import { log } from '~lib/log'
import { PageController } from '~lib/page-controller'
import { RegistrationController } from '~lib/registration-controller'
import { getSanitizedCurrentUrl } from '~lib/url'
import { wakeUp } from '~messages/tabs'

export const pageControllerInstance = new PageController('content-script', getSanitizedCurrentUrl())
export const registrationControllerInstance = new RegistrationController(pageControllerInstance)

export const onPageControllerReady = (async () => {
  await pageControllerInstance.refreshResources()
  return pageControllerInstance
})()
  .then((instance) => {
    if (typeof window.navigation !== 'undefined') { // TODO validate polyfill works (firefox)
      window.navigation?.addEventListener('navigate', () => setTimeout(() => {
        log.info('Navigation event', window.location.href)
        const url = getSanitizedCurrentUrl()
        instance.changeRoute(url)
      }))
    }

    wakeUp.stream.subscribe(() => {
      log.info('Waking up, updating resources')
      instance.refreshResources()
    })

    merge(
      fromEvent<KeyboardEvent>(document, 'keypress'),
      fromEvent<KeyboardEvent>(document, 'keydown')
    ).pipe(throttleTime(100))
      .pipe(filter(() => !registrationControllerInstance.isRegistrationInProgress()))
      .pipe(filter((e) =>
        !(e.metaKey || e.ctrlKey)
      ))
      .subscribe(async (event) => {
        instance.onKeyPress(event)
          .then((presses) => {
            if (presses.length) {
              toast.success('Binding activated', { duration: 500 })
            }
          })
          .catch(err => {
            const message = match<Error, string>(err)
              .when(() => err instanceof InexistentElementError, () => 'The element that the binding is trying to target does not exist on this page. You can try binding it again')
              .when(() => err instanceof VindError, () => err.message)
              .otherwise(() => 'An unknown error occurred')
            toast.error(message, { duration: 5000 })
          })
      })
  })
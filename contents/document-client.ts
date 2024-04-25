import "@virtualstate/navigation/polyfill"
import { filter, fromEvent, merge, throttleTime } from 'rxjs'
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
      .subscribe((event) => {
        instance.onKeyPress(event)
      })
  })
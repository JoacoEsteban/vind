import "@virtualstate/navigation/polyfill"
import { log } from '~lib/log'
import { PageController } from '~lib/page-controller'
import { getSanitizedCurrentUrl } from '~lib/url'
import { wakeUp } from '~messages/tabs'

export const pageControllerInstance = new PageController('content-script', getSanitizedCurrentUrl())
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

    document.addEventListener('keydown', instance.onKeyPress.bind(instance))
  })
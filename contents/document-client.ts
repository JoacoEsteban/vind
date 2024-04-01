import "@virtualstate/navigation/polyfill"
import { log } from '~lib/log'
import { PageController } from '~lib/page-controller'
import { wakeUp } from '~messages/tabs'

export const pageControllerInstance = new PageController('content-script')
export const onPageControllerReady = (async () => {
  const controller = pageControllerInstance
  await controller.updateBindings()
  return controller
})()
  .then((instance) => {
    if (typeof window.navigation !== 'undefined') { // TODO validate polyfill works (firefox)
      window.navigation?.addEventListener('navigate', () => setTimeout(() => {
        log.info('Navigation event', window.location.href)
        instance.softUpdateBindings()
      }))
    }
    instance.onEveryBindingEvent$.subscribe(() => {
      log.info('Binding updated, updating bindings')
      instance.updateBindings()
    })
    wakeUp.stream.subscribe(() => {
      log.info('Waking up, updating bindings')
      instance.updateBindings()
    })
    document.addEventListener('keypress', instance.onKeyPress.bind(instance))
  })
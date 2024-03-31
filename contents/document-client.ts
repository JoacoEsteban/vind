import "@virtualstate/navigation/polyfill"
import { log } from '~lib/log'
import { PageController } from '~lib/page-controller'
import { on } from '~lib/storage'

export const pageControllerInstance = new PageController()
export const onPageControllerReady = (async () => {
  const controller = pageControllerInstance
  await controller.updateBindings()
  return controller
})()
  .then((instance) => {
    window.navigation?.addEventListener('navigate', () => setTimeout(() => {
      log.info('Navigation event', window.location.href)
      instance.updateBindings()
    }))
    on('bindings', () => {
      log.info('Storage bindings changed')
      instance.updateBindings()
    })
    document.addEventListener('keypress', instance.onKeyPress.bind(instance))
  })
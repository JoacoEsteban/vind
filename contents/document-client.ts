import { PageController } from '~lib/page-controller'
import { on } from '~lib/storage'

export const pageControllerInstance = new PageController()

on('bindings', () => {
  console.log('storage bindings changed')
  pageControllerInstance.updateBindings()
})
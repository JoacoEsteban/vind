import { PageController } from '~lib/page-controller'
import { on } from '~lib/storage'

const pageController = new PageController()

on('bindings', () => {
  console.log('storage bindings changed')
  pageController.updateBindings()
})
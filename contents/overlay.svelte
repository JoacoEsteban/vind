<script context="module" lang="ts">
  import styleText from 'data-text:~/style.sass'
  import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'

  export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
    css: ['./fonts.css'],
  }

  export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement('style')
    style.textContent = styleText
    return style
  }
</script>

<script lang="ts">
  import { makeEventListenerStack } from '@solid-primitives/event-listener'
  import { askForBindingStream } from '~/messages'
  import Filters from '~components/filters.svelte'
  import Popup from '~components/popup.svelte'
  import { Binding } from '~lib/binding'
  import {
    highlightElementUntilLeave,
    isBindableElement,
    recordInputKey,
  } from '~lib/element'
  import { log } from '~lib/log'
  import { PromiseWithResolvers } from '~lib/polyfills'
  import { themeController } from '~lib/theme-controller'
  import { getElementByXPath, getXPath } from '~lib/xpath'
  import { showOverlayStream } from '~messages/tabs'
  import { pageControllerInstance } from './document-client'

  let highlightedElement: HTMLElement | null = null
  let showingOverlay = false

  async function register() {
    const { resolve: confirmElement, promise: onElementSelected } =
      PromiseWithResolvers<void>()

    const mouseoverListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!isBindableElement(target)) {
        return
      }

      highlightedElement = target

      // target.addEventListener('click', (event) => {
      //   event.preventDefault()
      //   event.stopPropagation()
      // })
      const { cancel } = highlightElementUntilLeave(target)
      onElementSelected.then(cancel)
    }

    const clickListener = (event: MouseEvent) => {
      if (!highlightedElement) {
        return
      }

      log.info('CLICKKK')
      event.preventDefault()
      event.stopPropagation()

      const selector = getXPath(highlightedElement)

      log.info('clicked', selector, getElementByXPath(selector))
      confirmElement()
    }

    const [listen, clear] = makeEventListenerStack(document, {
      passive: true,
      capture: true,
    })

    listen('mouseover', mouseoverListener)
    listen('mousedown', clickListener)
    // listen('click', (event) => {
    //   event.preventDefault()
    //   event.stopPropagation()
    // })
    listen('keydown', (event) => event.key === 'Escape' && confirmElement())

    log.info('Waiting for element selection')
    await onElementSelected
    clear()
    log.info('Element selected')

    if (!highlightedElement) {
      throw new Error('No element selected')
    }

    const key = await recordInputKey()
    log.info('selected key', key)

    const binding = Binding.fromElement(highlightedElement, key)
    log.info('Saving binding:', binding)

    pageControllerInstance.bindingsChannel.addBinding(binding)
  }

  function toggleVisibility() {
    log.info('on toggle visibility')
    showingOverlay = !showingOverlay
  }
  function closePopup() {
    showingOverlay = false
  }

  askForBindingStream.subscribe(
    ((registering) => () => {
      if (registering) {
        log.info('already registering a binding')
        return
      }
      registering = true
      log.success('registering binding')
      register().finally(() => {
        log.success('registering done')
        registering = false
      })
    })(false),
  )
  showOverlayStream.subscribe(toggleVisibility)
</script>

<div use:themeController>
  <Popup visible={showingOverlay} {pageControllerInstance} close={closePopup} />
  <Filters />
</div>

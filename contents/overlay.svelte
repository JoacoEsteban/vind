<script context="module" lang="ts">
  import styleText from 'data-text:~/style.sass'
  import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'
  import { onMount } from 'svelte'

  export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
  }

  export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement('style')
    style.textContent = styleText
    return style
  }
</script>

<script lang="ts">
  import {
    makeEventListener,
    makeEventListenerStack,
  } from '@solid-primitives/event-listener'
  import { askForBindingStream } from '~/messages'
  import Filters from '~components/filters.svelte'
  import Popup from '~components/popup.svelte'
  import { Binding } from '~lib/binding'
  import {
    highlightElementUntilLeave,
    isBindableElement,
    recordInputKey,
  } from '~lib/element'
  import { PromiseWithResolvers } from '~lib/polyfills'
  import { getElementByXPath, getXPath } from '~lib/xpath'
  import { showOverlayStream } from '~messages/tabs'

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

      const { cancel } = highlightElementUntilLeave(target)
      onElementSelected.then(cancel)
    }

    const clickListener = (event: MouseEvent) => {
      if (!highlightedElement) {
        return
      }

      console.log('CLICKKK')
      event.preventDefault()
      event.stopPropagation()

      const selector = getXPath(highlightedElement)

      console.log('clicked', selector, getElementByXPath(selector))
      confirmElement()
    }

    const [listen, clear] = makeEventListenerStack(document, {
      passive: true,
      capture: true,
    })

    listen('mouseover', mouseoverListener)
    listen('mousedown', clickListener)
    listen('keydown', (event) => event.key === 'Escape' && confirmElement())

    await onElementSelected
    clear()

    if (!highlightedElement) {
      throw new Error('No element selected')
    }

    const key = await recordInputKey()
    console.log('ke??y', key)

    try {
      const binding = Binding.fromElement(highlightedElement, key)
      console.log('save', binding)
      await binding.save()
    } catch (error) {
      console.error('error', error)
    }
  }

  function toggleVisibility() {
    showingOverlay = !showingOverlay
  }

  askForBindingStream.subscribe(register)
  showOverlayStream.subscribe(toggleVisibility)

  onMount(() => {
    console.log('mounted')
  })
</script>

<Popup visible={showingOverlay} />
<Filters />
<!-- 
<div class="hw-top bg-black pointer-events-none">
  <h1>Vind Overlay</h1>
  {#if showBindingTargetOverlay}
    <h2>Registering new binding</h2>
  {/if}
</div> -->

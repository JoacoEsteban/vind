<script context="module" lang="ts">
  import '~lib/fonts-importer'
  import styleText from 'data-text:~/style.sass'
  import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'

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
  import { onMount } from 'svelte'
  import toast, { Toaster } from 'svelte-french-toast/dist'
  import { askForBindingStream } from '~/messages'
  import Filters from '~components/filters.svelte'
  import Popup from '~components/popup.svelte'
  import { log } from '~lib/log'
  import { themeController } from '~lib/theme-controller'
  import { showOverlayStream } from '~messages/tabs'
  import {
    pageControllerInstance,
    registrationControllerInstance,
  } from './document-client'

  let showingOverlay = false

  function toggleVisibility() {
    log.info('on toggle visibility')
    showingOverlay = !showingOverlay
  }
  function closePopup() {
    showingOverlay = false
  }

  askForBindingStream.subscribe(() => {
    const registration = registrationControllerInstance.register()

    const loadingToast = toast.loading(
      'Registering Binding. Press ESC to cancel.',
    )

    registration.then(() => {
      log.success('registering done')
      toast.success('Binding registered')
    })

    registration.catch((err) => {
      log.error('registering failed', err)
      toast.error('Failed to register binding')
    })

    registration.finally(() => toast.dismiss(loadingToast))
  })
  showOverlayStream.subscribe(toggleVisibility)
</script>

<div use:themeController>
  <Popup visible={showingOverlay} {pageControllerInstance} close={closePopup} />
  <Filters />
  <Toaster />
</div>

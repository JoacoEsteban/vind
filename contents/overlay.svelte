<script context="module" lang="ts">
  import '~lib/fonts-importer'
  import styleText from 'data-text:~/style.scss'
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
  import Filters from '~components/filters.svelte'
  import Popup from '~components/popup.svelte'
  import Toaster from '~components/toaster.svelte'
  import { log } from '~lib/log'
  import { themeController } from '~lib/theme-controller'
  import type { Path } from '~lib/url'
  import { newBinding } from '~messages/index'
  import { showOverlayStream } from '~messages/tabs'
  import { DocumentClient } from './document-client'
  import OverlayTarget from '../components/overlay-target.svelte'

  const client = new DocumentClient()
  const { pageControllerInstance, registrationControllerInstance } = client
  let showingOverlay = false
  const registering$ = registrationControllerInstance.registrationInProgress$

  function toggleVisibility() {
    log.info('on toggle visibility')
    showingOverlay = !showingOverlay
  }
  function closePopup() {
    showingOverlay = false
  }

  function registerNewBinding(path?: Path) {
    client.registerNewBinding(path)
  }

  newBinding.stream.subscribe(() => registerNewBinding())

  showOverlayStream.subscribe(toggleVisibility)
</script>

<div use:themeController>
  <Popup
    visible={showingOverlay}
    disabled={$registering$}
    {pageControllerInstance}
    close={closePopup}
    on:registerNewBinding={(e) => registerNewBinding(e.detail.path)} />
  <Filters />
  <Toaster />
  <OverlayTarget {registrationControllerInstance} {pageControllerInstance} />
</div>

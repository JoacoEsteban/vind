<script context="module" lang="ts">
  import '~lib/fonts-importer'
  import styleText from 'data-text:~/style.scss'
  import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'

  export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
    all_frames: true,
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
  import { askForOptionsPage, newBinding } from '~messages/index'
  import { showOverlayStream } from '~messages/tabs'
  import { DocumentClient } from './document-client'
  import OverlayTarget from '../components/overlay-target.svelte'
  import { map, of, switchMap } from 'rxjs'
  import {
    ElementSelectionState,
    RegistrationState,
  } from '~lib/registration-controller'
  import { match } from 'ts-pattern'

  const client = new DocumentClient()
  const { pageControllerInstance, registrationControllerInstance } = client
  let showingOverlay = false
  const registering$ = registrationControllerInstance.registrationInProgress$
  const disableUi$ = registrationControllerInstance.elementSelectionState$.pipe(
    map((state) =>
      match(state)
        .with(ElementSelectionState.Paused, () => true)
        .otherwise(() => false),
    ),
  )

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

  if (!client.isIframe) {
    newBinding.stream.subscribe(() => registerNewBinding())
    showOverlayStream.subscribe(toggleVisibility)
  }
</script>

{#if !client.isIframe}
  <div use:themeController>
    <Popup
      visible={showingOverlay}
      ghost={$registering$}
      disabled={$disableUi$}
      {pageControllerInstance}
      close={closePopup}
      on:registerNewBinding={(e) => registerNewBinding(e.detail.path)} />
    <Filters />
    <Toaster disabled={$disableUi$} />
    <OverlayTarget {registrationControllerInstance} {pageControllerInstance} />
  </div>
{/if}

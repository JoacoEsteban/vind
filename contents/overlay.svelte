<script lang="ts">
  import '~/lib/fonts-importer'
  import COMMIT_SHA from 'virtual:commit-sha'
  import Filters from '~/components/filters.svelte'
  import Popup from '~/components/popup.svelte'
  import Toaster from '~/components/toaster.svelte'
  import { getOverlayBuildLabel } from '~/lib/build-label'
  import { log } from '~/lib/log'
  import { themeController } from '~/lib/theme-controller'
  import type { Path } from '~/lib/url'
  import { askForOptionsPage, newBinding } from '~/messages/index'
  import { showOverlayStream } from '~/messages/tabs'
  import { DocumentClient } from './document-client'
  import OverlayTarget from '../components/overlay-target.svelte'
  import { map, of, switchMap } from 'rxjs'
  import {
    ElementSelectionState,
    RegistrationState,
  } from '~/lib/registration-controller'
  import { match } from 'ts-pattern'
  import { ENV_PROD } from '~/lib/env'
  import { OverlayId } from '~/lib/test-id'

  const client = new DocumentClient()
  const testid = OverlayId
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

  const sha = getOverlayBuildLabel(COMMIT_SHA, ENV_PROD)

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
  <div use:themeController data-testid={testid.id}>
    <Popup
      {sha}
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

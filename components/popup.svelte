<script lang="ts">
  import { combineLatest, map, Observable } from 'rxjs'
  import { askForBinding, askForOptionsPage } from '~/messages'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { draggable } from '~lib/draggable'
  import type { PageController } from '~lib/page-controller'
  import { Path } from '~lib/url'
  import SymbolButton from './symbol-button.svelte'
  import Toggle from './toggle.svelte'

  export let visible: boolean = false
  export let disabled: boolean = false
  export let pageControllerInstance: PageController
  export let close: () => void
  const currentSite = pageControllerInstance.currentSiteSplitted$
  const displayBindings = pageControllerInstance.displayBindings$
  const bindingsMap = combineLatest([displayBindings, currentSite]).pipe(
    map(([{ overlapping, nonOverlapping }, site]) => [
      {
        isCurrentPath: true,
        bindings: overlapping,
      },
      {
        isCurrentPath: false,
        bindings: nonOverlapping,
      },
    ]),
  )

  const overridesSet = pageControllerInstance.overridesSet$
  const includedPaths = pageControllerInstance.includedBindingPaths$

  function openOptions() {
    askForOptionsPage()
  }

  async function registerNewBinding() {
    askForBinding()
  }
</script>

<div class="popup-wrapper" class:visible class:ghost={disabled} use:draggable>
  <div class="popup-container bg-blur">
    <div class="flex justify-between sticky top-0 z-10">
      <h2 class="font-black m-0 opacity-25">Vind</h2>
      <div class="flex">
        <SymbolButton
          opaque={true}
          name="gear"
          on:click={openOptions}
          size={'40px'} />
        <div class="w-2" />
        <SymbolButton
          opaque={true}
          name="xMark"
          size={'40px'}
          padding={'30%'}
          on:click={close} />
      </div>
    </div>
    <main class="py-2 px-1">
      <div class="mx-auto mb-5 flex flex-col items-center justify-center gap-2">
        <DisplayUrl domain={$currentSite.domain} size={'text-4xl'} />
        {#if !$currentSite.path.isRoot()}
          <DisplayUrl path={$currentSite.path} size={'text-l'} />
        {/if}
      </div>
      <div class="text-center">
        <div>
          {#if $displayBindings.overlapping.size === 0}
            <h3 class="font-bold mb-5">No bindings on this page</h3>
          {/if}

          {#each $bindingsMap as bmap, i}
            {#if bmap.bindings.size}
              {#if i > 0}
                <div class="divider"></div>
              {/if}
              <div>
                {#if !bmap.isCurrentPath}
                  <h3
                    class="font-bold made-tommy text-xl mb-4 flex gap-2 justify-center">
                    Others on <DisplayUrl
                      domain={$currentSite.domain}
                      size={'text-md'} />
                  </h3>
                {/if}

                {#each bmap.bindings as [path, bindings]}
                  <h5 class="w-full flex justify-between mb-3">
                    <span class="flex gap-1">
                      <DisplayUrl path={new Path(path)} size={'text-md'} />
                    </span>
                    <Toggle
                      checked={$includedPaths.has(path)}
                      on:click={() =>
                        pageControllerInstance.togglePath(path)} />
                  </h5>
                  <div
                    class="grid grid-cols-5 gap-4 mb-5 v_toggle-availability"
                    class:enabled={$includedPaths.has(path)}>
                    {#each bindings as binding}
                      <BindingButton
                        disabled={!$includedPaths.has(path)}
                        {binding}
                        on:click={() =>
                          pageControllerInstance.clickBinding(binding)}
                        on:focus={() =>
                          pageControllerInstance.focusBinding(binding)}
                        on:blur={() =>
                          pageControllerInstance.blurBinding(binding)} />
                    {/each}
                  </div>
                {/each}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </main>
    <div class="flex justify-center sticky bottom-0">
      <Button on:click={registerNewBinding}>Bind</Button>
    </div>
  </div>
</div>

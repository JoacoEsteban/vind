<script lang="ts">
  import { combineLatest, filter, interval, map, Observable, pipe } from 'rxjs'
  import { createEventDispatcher } from 'svelte'
  import { askForBinding, askForOptionsPage } from '~/messages'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { colorSeeds } from '~lib/definitions'
  import { draggable } from '~lib/draggable'
  import { generateId } from '~lib/id'
  import { MapToOrderedTuple } from '~lib/map'
  import type { PageController } from '~lib/page-controller'
  import { Path } from '~lib/url'
  import SymbolButton from './symbol-button.svelte'
  import Toggle from './toggle.svelte'

  export let visible: boolean = false
  export let disabled: boolean = false
  export let pageControllerInstance: PageController
  export let close: () => void

  const dispatch = createEventDispatcher<{
    registerNewBinding: { path?: Path }
  }>()

  const currentSite = pageControllerInstance.currentSiteSplitted$
  const displayBindings = pageControllerInstance.domainBindingsByNesting$
  const bindingsMap = combineLatest([displayBindings, currentSite]).pipe(
    map(([{ enclosing, branching }, site]) => [
      {
        overlapping: true,
        bindings: MapToOrderedTuple(enclosing, (a, b) => {
          if (a === site.path.value) return -1
          if (b === site.path.value) return 1
          return a.localeCompare(b)
        }),
      },
      {
        overlapping: false,
        bindings: MapToOrderedTuple(branching, (a, b) => a.localeCompare(b)),
      },
    ]),
  )

  const bindsToPattern = currentSite.pipe(
    map((site) => site.path.inferPattern()),
  )

  const includedPaths = pageControllerInstance.includedBindingPaths$

  function openOptions() {
    askForOptionsPage()
  }

  async function registerNewBinding(path?: string) {
    dispatch('registerNewBinding', { path: path ? new Path(path) : undefined })
  }
</script>

{#if $bindingsMap}
  <div
    class="popup-wrapper"
    class:visible
    class:shrink={disabled}
    use:draggable>
    <div class="popup-container bg-blur" class:ghost={disabled}>
      <div class="flex justify-between sticky top-0 z-10">
        <h2 class="font-black m-0 opacity-25">Vind</h2>
        <div class="flex">
          <SymbolButton
            {disabled}
            opaque={true}
            name="gear"
            on:click={openOptions}
            size={'40px'} />
          <div class="w-2" />
          <SymbolButton
            {disabled}
            opaque={true}
            name="xMark"
            size={'40px'}
            padding={'30%'}
            on:click={close} />
        </div>
      </div>
      <main class="py-2 px-1">
        <div
          class="mx-auto mb-5 flex flex-col items-center justify-center gap-2">
          <DisplayUrl domain={$currentSite.domain} size={'text-4xl'} />
          {#if !$currentSite.path.isRoot()}
            <DisplayUrl
              path={$currentSite.path}
              size={'text-l'}
              maxPathCharLength={15} />
          {/if}
        </div>
        <div class="text-center">
          <div>
            {#if $displayBindings}
              {#if $displayBindings.enclosing.size === 0}
                <h3 class="font-bold mb-5">No bindings on this page</h3>
              {/if}
            {/if}

            {#each $bindingsMap as bmap, i}
              {#if bmap.bindings.length}
                {#if i > 0}
                  <div class="divider"></div>
                {/if}
                <div>
                  {#if !bmap.overlapping}
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
                      {#if bmap.overlapping}
                        <Toggle
                          {disabled}
                          checked={$includedPaths.has(path)}
                          on:click={() =>
                            pageControllerInstance.togglePath(path)} />
                      {/if}
                    </h5>
                    <div
                      class="grid grid-cols-5 gap-4 mb-5 v_toggle-availability"
                      class:enabled={$includedPaths.has(path)}>
                      {#each bindings as binding}
                        <BindingButton
                          triggeredBinding$={pageControllerInstance.triggeredBinding$}
                          disabled={disabled || !$includedPaths.has(path)}
                          {binding}
                          on:click={() =>
                            pageControllerInstance.clickBinding(binding)}
                          on:focus={() =>
                            pageControllerInstance.focusBinding(binding)}
                          on:blur={() =>
                            pageControllerInstance.blurBinding(binding)} />
                      {/each}
                      {#if $includedPaths.has(path)}
                        <SymbolButton
                          size="50px"
                          padding=".9em"
                          name={'plus'}
                          glassy
                          on:click={() => registerNewBinding(path)} />
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </main>
      <div class="flex flex-col justify-center sticky bottom-0">
        <Button {disabled} on:click={() => registerNewBinding()}>Bind</Button>

        {#if !$bindsToPattern.is($currentSite.path)}
          <div class="flex justify-center items-center gap-2 mt-2">
            → <DisplayUrl path={$bindsToPattern} size={'text-sm'} />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

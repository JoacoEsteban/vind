<script lang="ts">
  import { map, Observable } from 'rxjs'
  import { askForBinding, askForOptionsPage } from '~/messages'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { Binding } from '~lib/binding'
  import { draggable } from '~lib/draggable'
  import type { PageController } from '~lib/page-controller'
  import SymbolButton from './symbol-button.svelte'

  export let visible: boolean = false
  export let pageControllerInstance: PageController
  export let close: () => void
  const currentUrl = pageControllerInstance.currentSite$
  const currentPathBindings = pageControllerInstance.currentPathBindings$
  const bindingsMap = pageControllerInstance.otherDomainBindingsMap$.pipe(
    map(({ enclosing, branching }) => [
      {
        title: 'Bindings inherited from parent paths',
        bindings: enclosing,
      },
      {
        title: 'Other bindings on this domain',
        bindings: branching,
      },
    ]),
  )

  const overridesSet = pageControllerInstance.overridesSet$
  const currentDomain = pageControllerInstance.currentSiteSplitted$
  const includedPaths = pageControllerInstance.includedBindingPaths$

  function openOptions() {
    askForOptionsPage()
  }

  async function registerNewBinding() {
    askForBinding()
  }
</script>

<div class="popup-wrapper" class:visible use:draggable>
  <div class="popup-container bg-blur">
    <main class="prose prose-2xs">
      <div class="flex justify-between">
        <h2 class="text-neutral-content font-black m-0 opacity-25">Vind</h2>
        <div class="flex">
          <SymbolButton name="gear" on:click={openOptions} size={'40px'} />
          <div class="w-2" />
          <SymbolButton
            name="xMark"
            size={'40px'}
            padding={'30%'}
            on:click={close} />
        </div>
      </div>
      <h1 class="text-center prose-headings">
        <DisplayUrl url={$currentUrl} />
      </h1>
      <div class="text-center">
        <div>
          {#if $currentPathBindings.length === 0}
            <h3 class="text-neutral-content font-bold">
              No bindings on this page
            </h3>
          {:else}
            <h3 class="text-neutral-content font-bold">Matching Bindings</h3>
            <div class="grid grid-cols-5 gap-4 mb-5">
              {#each $currentPathBindings as binding}
                <BindingButton
                  {binding}
                  on:click={() => pageControllerInstance.clickBinding(binding)}
                  on:focus={() => pageControllerInstance.focusBinding(binding)}
                  on:blur={() => pageControllerInstance.blurBinding(binding)} />
              {/each}
            </div>
          {/if}

          {#each $bindingsMap as bmap}
            {#if bmap.bindings.size}
              <hr />
              <div>
                <h3 class="text-neutral-content font-bold">
                  <!-- Bindings for {$currentDomain.domain?.value} -->
                  {bmap.title}
                </h3>

                {#each bmap.bindings as [path, bindings]}
                  <h5 class="w-full flex justify-between mb-3">
                    <span>
                      Bindings on <b> {path} </b>
                    </span>
                    <input
                      type="checkbox"
                      class="toggle"
                      checked={$includedPaths.has(path)}
                      on:click={() =>
                        pageControllerInstance.togglePath(path)} />
                  </h5>
                  <div
                    class="grid grid-cols-5 gap-4 mb-5 v_toggle-availability"
                    class:enabled={$includedPaths.has(path)}>
                    {#each bindings as binding}
                      <BindingButton
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
        <div class="flex justify-center">
          <Button on:click={registerNewBinding}>Bind</Button>
        </div>
      </div>
    </main>
  </div>
</div>

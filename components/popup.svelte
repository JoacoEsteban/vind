<script lang="ts">
  import { askForBinding, askForOptionsPage } from '~/messages'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { draggable } from '~lib/draggable'
  import type { PageController } from '~lib/page-controller'

  export let visible: boolean = false
  export let pageControllerInstance: PageController
  const currentUrl = pageControllerInstance.currentSite$
  const bindingsMap = pageControllerInstance.bindingsMap$

  function openOptions() {
    askForOptionsPage()
  }

  async function registerNewBinding() {
    askForBinding()
  }
</script>

<div class="popup-container bg-blur" use:draggable class:visible>
  <main class="prose prose-2xs">
    <div class="flex justify-between">
      <h2 class="text-neutral-content font-black m-0 opacity-25">Vind</h2>
      <button class="btn btn-outline btn-circle" on:click={openOptions}
        >⚙️</button>
    </div>
    <h1 class="text-center prose-headings">
      <DisplayUrl url={$currentUrl} />
    </h1>
    <div class="text-center">
      <div>
        <h3 class="text-neutral-content font-bold">
          {#if $bindingsMap.size === 0}
            No bindings found
          {:else}
            Matching Bindings
          {/if}
        </h3>

        {#each $bindingsMap as [url, bindings]}
          <h5 class="w-full flex justify-center mb-3">
            <b> <DisplayUrl {url} /> </b>
          </h5>
          <div class="grid grid-cols-5 gap-4 mb-5">
            {#each bindings as binding}
              <BindingButton
                {binding}
                on:click={() => pageControllerInstance.clickBinding(binding)}
                on:focus={() => pageControllerInstance.focusBinding(binding)}
                on:blur={() => pageControllerInstance.blurBinding(binding)} />
            {/each}
          </div>
        {/each}
      </div>
      <div class="flex justify-center">
        <Button on:click={registerNewBinding}>Click to register</Button>
      </div>
    </div>
  </main>
</div>

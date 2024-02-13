<script lang="ts">
  import { onMount } from 'svelte'
  import { askForBinding, askForOptionsPage } from '~/messages'
  import BindingButton from '~components/binding-button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { pageControllerInstance } from '~contents/document-client'
  import { Binding, getBindingsForSiteAsUrlMap } from '~lib/binding'
  import { draggable } from '~lib/draggable'
  import { on } from '~lib/storage'
  import { makeDisplayPattern, makeDisplayUrl } from '~lib/url'
  import { getCurrentUrl } from '~messages/tabs'

  let currentUrl: string = ''
  let bindingsMap: Map<string, Binding[]> = new Map()

  function openOptions() {
    askForOptionsPage()
  }

  async function loadCurrentBindings() {
    currentUrl = (await getCurrentUrl()) || ''

    if (!currentUrl) {
      throw new Error('No current url')
    }

    bindingsMap = await getBindingsForSiteAsUrlMap(new URL(currentUrl))
  }

  async function registerNewBinding() {
    askForBinding()
  }

  async function deleteBinding(binding: Binding) {
    binding.remove()
    await loadCurrentBindings()
  }

  onMount(() => {
    on('bindings', () => {
      loadCurrentBindings()
    })
    loadCurrentBindings()
  })
</script>

<div class="popup-container bg-blur" use:draggable>
  <main class="prose prose-2xs">
    <div class="flex justify-between">
      <h2 class="text-neutral-content font-black m-0 opacity-25">Vind</h2>
      <button class="btn btn-outline btn-circle" on:click={openOptions}
        >⚙️</button>
    </div>
    <h1 class="text-center prose-headings">
      <DisplayUrl url={currentUrl} />
    </h1>
    <div class="text-center">
      <div>
        <h3 class="text-neutral-content font-bold">
          {#if bindingsMap.size === 0}
            No bindings found
          {:else}
            Matching Bindings
          {/if}
        </h3>

        {#each bindingsMap as [url, bindings]}
          <h5 class="w-full flex justify-center mb-3">
            <b> <DisplayUrl {url} /> </b>
          </h5>
          <div class="grid grid-cols-5 gap-4 mb-5">
            {#each bindings as binding}
              <BindingButton
                {binding}
                on:click={() => pageControllerInstance.clickBinding(binding)} />
            {/each}
          </div>
        {/each}
      </div>
      <div class="flex justify-center">
        <button class="btn btn-primary" on:click={registerNewBinding}
          >Click to register</button>
      </div>
    </div>
  </main>
</div>

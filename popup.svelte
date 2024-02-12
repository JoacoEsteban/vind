<script lang="ts">
  // import './style.css'
  import { onMount } from 'svelte'
  import { askForBinding } from '~/messages'
  import BindingButton from '~components/binding-button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { Binding, getBindingsForSiteAsUrlMap } from '~lib/binding'
  import { makeDisplayPattern, makeDisplayUrl } from '~lib/url'
  import { getCurrentUrl } from '~messages/tabs'

  let currentUrl: string = ''
  let bindingsMap: Map<string, Binding[]> = new Map()

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
    loadCurrentBindings()
  })
</script>

<div class="container">
  <main class="prose prose-2xs">
    <h2 class=" text-neutral font-black m-0">Vind</h2>
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
                on:delete={() => deleteBinding(binding)} />
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

<style lang="scss">
  .container {
    $width: 470px;
    min-width: $width;
    // max-width: $width;

    padding: 16px;
  }
</style>

<script lang="ts">
  import './style.css'
  import { onMount } from 'svelte'
  import { askForBinding } from '~/messages'
  import { Binding, getBindingsForSite } from '~lib/binding'
  import { sanitizeHref, sanitizeUrl } from '~lib/url'
  import { getCurrentUrl } from '~messages/tabs'

  let currentUrl: string | null = null
  $: displayUrl = currentUrl && sanitizeHref(currentUrl)
  let bindings: Binding[] = []

  async function loadCurrentBindings() {
    currentUrl = await getCurrentUrl()

    if (!currentUrl) {
      throw new Error('No current url')
    }

    bindings = await getBindingsForSite(new URL(currentUrl))
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
    <h1 class="text-right prose-headings">Vind</h1>
    <div>
      <div>
        <h4>
          Current bindings for
          <b>
            {displayUrl || ''}
          </b>
        </h4>
        {#each bindings as binding}
          <div>
            <span><b>{binding.key.toUpperCase()}</b></span>
            <span>{binding.selector}</span>
            <button
              on:click={() => deleteBinding(binding)}
              class="btn btn-delete">Delete</button>
          </div>
        {/each}
      </div>
      <div>
        <button class="btn btn-danger" on:click={registerNewBinding}
          >Click to register</button>
      </div>
    </div>
  </main>
</div>

<style lang="scss">
  .container {
    $width: 470px;
    min-width: $width;
    max-width: $width;
    padding: 10px;
  }
</style>

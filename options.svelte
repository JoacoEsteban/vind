<script lang="ts">
  import '~/style.sass'
  import '~/contents/fonts.css'
  import chroma from 'chroma-js'
  import { onMount } from 'svelte'
  import BindingButton from '~components/binding-button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { Binding, getBindingsAsUrlMap } from '~lib/binding'
  import { on } from '~lib/storage'

  let bindingsMap: Map<string, Binding[]> = new Map()
  const bg1 = chroma.random()
  const bg2 = bg1.set('hsl.h', '+25')

  async function loadCurrentBindings() {
    bindingsMap = await getBindingsAsUrlMap()
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

<div
  class="options-container p-5 h-screen"
  style="--_bg-1: {bg1.hex()}; --_bg-2: {bg2.hex()}">
  <div class="sm:container m-auto bg-blur py-10 p-5">
    <main class="prose prose-2xs max-w-full">
      <h1 class="font-black m-0">Vind Options</h1>
      <div class="">
        <div>
          <h3 class="text-neutral-content font-bold">
            {#if bindingsMap.size === 0}
              No bindings found
            {:else}
              All Bindings
            {/if}
          </h3>

          {#each bindingsMap as [url, bindings]}
            <h5 class="w-full flex mb-3">
              <b> <DisplayUrl {url} /> </b>
            </h5>
            <div class="flex mb-5">
              {#each bindings as binding}
                <span class="mr-3">
                  <BindingButton
                    {binding}
                    on:click={() => deleteBinding(binding)} />
                </span>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </main>
  </div>
</div>

<style lang="sass">
.options-container
  background: linear-gradient(180deg, var(--_bg-1, #1e3a8a) 0%, var(--_bg-2, #f544f5) 100%)
</style>

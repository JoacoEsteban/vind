<script lang="ts">
  import '~/style.sass'
  import '~/lib/fonts-importer'
  import chroma from 'chroma-js'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import { Binding } from '~lib/binding'
  import { log } from '~lib/log'
  import { PageController } from '~lib/page-controller'
  import { wakeUp } from '~messages/tabs'

  const pageController = new PageController('options')
  pageController.refreshResources()

  wakeUp.stream.subscribe(() => {
    log.info('Waking up options page')
    pageController.refreshResources()
  })

  const options = [
    {
      name: 'Bindings',
      key: 'bindings',
    },
    {
      name: 'Overrides',
      key: 'overrides',
    },
  ]
  let activeKey = options[0].key

  const bindingsMap = pageController.bindingsByPathMap$
  const overridesMap = pageController.overridesByPathMap$
  const bg1 = chroma.random()
  const bg2 = bg1.set('hsl.h', '+25')

  async function deleteBinding(binding: Binding) {
    pageController.bindingsChannel.removeBinding(binding.id)
  }
  async function removeOverride(id: number) {
    pageController.overridesChannel.removePageOverride(id)
  }
</script>

<div
  class="options-container p-5 h-screen"
  style="--_bg-1: {bg1.hex()}; --_bg-2: {bg2.hex()}">
  <div class="sm:container m-auto bg-blur py-10 p-5">
    <main class="prose prose-2xs max-w-full">
      <h1 class="font-black m-0">Vind Options</h1>
      <div role="tablist" class="tabs tabs-boxed">
        {#each options as option}
          <button
            role="tab"
            class={'tab ' + (activeKey === option.key ? 'tab-active' : '')}
            on:click={() => (activeKey = option.key)}>
            {option.name}
          </button>
        {/each}
      </div>
      {#if activeKey === 'bindings'}
        <div class="container">
          <div>
            <h2 class="text-neutral-content font-bold">
              {#if $bindingsMap.size === 0}
                No bindings found
              {:else}
                Bindings
              {/if}
            </h2>

            {#each $bindingsMap as [domain, map]}
              <h5 class="w-full flex mb-3">
                <!-- <b> <DisplayUrl {url} /> </b> -->
                <b> {domain} </b>
              </h5>
              {#each map as [path, bindings]}
                <h5 class="w-full flex mb-3">
                  <!-- <b> <DisplayUrl {url} /> </b> -->
                  <b> {path} </b>
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
            {/each}
          </div>
        </div>
      {/if}
      {#if activeKey === 'overrides'}
        <div class="container">
          <div>
            <h2 class="text-neutral-content font-bold">
              {#if $overridesMap.size === 0}
                No Overrides found
              {:else}
                Overrides
              {/if}
            </h2>

            {#each $overridesMap as [domain, set]}
              <h3 class="w-full flex mb-3">
                <b> <DisplayUrl url={domain} /> </b>
                <!-- <b> {domain} </b> -->
              </h3>
              {#each set as [id, path]}
                <h4 class="w-full flex mb-3">
                  <!-- <b> <DisplayUrl url={path} /> </b> -->
                  <span> {path} </span>
                </h4>
                <Button on:click={() => removeOverride(id)}>Remove</Button>
              {/each}
            {/each}
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<style lang="sass">
.options-container
  background: linear-gradient(180deg, var(--_bg-1, #1e3a8a) 0%, var(--_bg-2, #f544f5) 100%)
</style>

<script lang="ts">
  import type { Observable } from 'rxjs'
  import { createEventDispatcher } from 'svelte'
  import DisplayUrl from '~/components/display-url.svelte'
  import { Domain, Path } from '~/lib/url'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import WithTooltip from '~components/with-tooltip.svelte'
  import type { Binding } from '~lib/binding'

  export let bindingsMap: Observable<[string, [string, Binding[]][]][]>

  const dispatch = createEventDispatcher<{
    remove: { id: string }
  }>()

  function deleteBinding(binding: Binding) {
    dispatch('remove', { id: binding.id })
  }
</script>

<div class="">
  <div>
    <h2 class="font-bold made-tommy">
      {#if $bindingsMap.length === 0}
        No bindings found
      {:else}
        Bindings
      {/if}
    </h2>

    {#each $bindingsMap as [domain, map]}
      <h5 class="mb-3">
        <DisplayUrl domain={new Domain(domain)} size={'text-2xl'} />
      </h5>
      {#each map as [path, bindings]}
        <h5 class="w-full flex mb-3">
          <!-- <b> <DisplayUrl {url} /> </b> -->
          <DisplayUrl path={new Path(path)} size={'text-l'} />
        </h5>
        <div class="flex mb-5 flex-wrap gap-3">
          {#each bindings as binding (binding.id)}
            <span>
              <WithTooltip placement="bottom">
                <BindingButton opaque={true} {binding} />
                <div slot="tooltip">
                  <Button
                    colorSeed={binding.key}
                    opaque={true}
                    icon={'trashFill'}
                    on:click={() => deleteBinding(binding)}>
                    Remove
                  </Button>
                </div>
              </WithTooltip>
            </span>
          {/each}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style lang="sass">
h1, h2, h3, h4, h5, h6
  mix-blend-mode: color-dodge

</style>

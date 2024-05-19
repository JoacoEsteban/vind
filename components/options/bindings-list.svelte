<script lang="ts">
  import type { Observable } from 'rxjs'
  import { createEventDispatcher } from 'svelte'
  import DisplayUrl from '~/components/display-url.svelte'
  import { Domain, Path } from '~/lib/url'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import Divider from '~components/divider.svelte'
  import Toggle from '~components/toggle.svelte'
  import WithTooltip from '~components/with-tooltip.svelte'
  import type { Binding } from '~lib/binding'
  import { wrapIterable } from '~lib/svelte'

  export let bindingsMap: Observable<
    [string, [string, { bindings: Binding[]; enabled: boolean }][]][]
  >

  const dispatch = createEventDispatcher<{
    remove: { id: string }
    togglePath: { domain: Domain; path: Path }
  }>()

  function deleteBinding(binding: Binding) {
    dispatch('remove', { id: binding.id })
  }

  function togglePath(domain: Domain, path: Path) {
    dispatch('togglePath', { domain, path })
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

    {#each wrapIterable($bindingsMap) as { item: [_domain, map], last }}
      {@const domain = new Domain(_domain)}
      <h5 class="mb-3">
        <DisplayUrl {domain} size={'text-2xl'} />
      </h5>
      {#each map as [_path, { bindings, enabled }]}
        {@const path = new Path(_path)}
        <div class="flex">
          <h5 class="w-full flex mb-3">
            <DisplayUrl {path} size={'text-l'} />
          </h5>
          <Toggle checked={enabled} on:click={() => togglePath(domain, path)} />
        </div>
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
      {#if !last}
        <Divider />
      {/if}
    {/each}
  </div>
</div>

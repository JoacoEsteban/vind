<script lang="ts">
  import type { Observable } from 'rxjs'
  import { createEventDispatcher } from 'svelte'
  import { match } from 'ts-pattern'
  import DisplayUrl from '~/components/display-url.svelte'
  import { Domain, Path } from '~/lib/url'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import Divider from '~components/divider.svelte'
  import Toggle from '~components/toggle.svelte'
  import WithTooltip from '~components/with-tooltip.svelte'
  import type { Binding } from '~lib/binding'
  import { ENV_PROD } from '~lib/env'
  import { wrapIterable } from '~lib/svelte'

  export let bindingsMap: Observable<
    [string, [string, { bindings: Binding[]; enabled: boolean }][]][]
  >
  export let currentlyEditingBinding: string | null = null

  $: editing = currentlyEditingBinding !== null

  const dispatch = createEventDispatcher<{
    remove: { id: string }
    togglePath: { domain: Domain; path: Path }
    updatePath: { domain: Domain; fromPath: Path; toPath: Path }
    changeKey: { id: string }
  }>()

  function deleteBinding(binding: Binding) {
    dispatch('remove', { id: binding.id })
  }

  function changeKey(binding: Binding) {
    dispatch('changeKey', { id: binding.id })
  }

  function togglePath(domain: Domain, path: Path) {
    dispatch('togglePath', { domain, path })
  }
  function updatePath(domain: Domain, fromPath: Path, toPath: Path) {
    dispatch('updatePath', { domain, fromPath, toPath })
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
          <div class="w-full flex mb-3">
            <DisplayUrl
              editable={!editing}
              {path}
              size={'text-l'}
              on:updatePath={(e) => updatePath(domain, path, e.detail.path)} />
          </div>
          <div class="v_toggle-availability" class:enabled={!editing}>
            <Toggle
              checked={enabled}
              on:click={() => togglePath(domain, path)}
              disabled={editing} />
          </div>
        </div>
        <div class="flex mb-5 flex-wrap gap-3">
          {#each bindings as binding (binding.id)}
            {@const disabled = match(currentlyEditingBinding)
              .with(null, binding.id, () => false)
              .otherwise(() => true)}
            <span>
              <WithTooltip placement="bottom" bordered enabled={!editing}>
                <div class="v_toggle-availability" class:enabled={!disabled}>
                  <BindingButton opaque={true} {binding} {disabled} />
                </div>
                <div slot="tooltip" class="flex gap-3">
                  <Button
                    colorSeed={binding.key}
                    opaque={true}
                    icon={'trashFill'}
                    on:click={() => deleteBinding(binding)}>
                    Remove
                  </Button>
                  <Button
                    colorSeed={binding.key}
                    opaque={true}
                    icon={'keyboard'}
                    on:click={() => changeKey(binding)}>
                    Change Key
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

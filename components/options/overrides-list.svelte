<script lang="ts">
  import type { Observable } from 'rxjs'
  import { createEventDispatcher } from 'svelte'
  import DisplayUrl from '~/components/display-url.svelte'
  import SymbolButton from '~/components/symbol-button.svelte'
  import { Domain, Path, safeUrl } from '~/lib/url'
  import { getOverrideBehavior } from '~lib/page-override'

  export let overridesMap: Observable<Map<string, Map<number, string>>>

  const dispatch = createEventDispatcher<{
    remove: { id: number }
  }>()

  function removeOverride(id: number) {
    dispatch('remove', { id })
  }
</script>

<div class="container">
  <div>
    <h2 class="font-bold made-tommy">
      {#if $overridesMap.size === 0}
        No Overrides found
      {:else}
        Overrides
      {/if}
    </h2>

    {#each $overridesMap as [domain, overrides]}
      <h3 class="w-full flex mb-3">
        on &nbsp;

        <a href={safeUrl(domain).href} target="_blank">
          <DisplayUrl
            domain={new Domain(domain)}
            path={new Path(domain)}
            size={'text-l'} />
        </a>
      </h3>
      {#each overrides as [id, path]}
        <div class="flex">
          <h4 class="w-full flex items-center flex-wrap gap-1 mb-3 mt-0">
            bindings from <DisplayUrl
              path={new Path(path)}
              size={'text-l'} />are
            <b>{getOverrideBehavior(domain, path)}</b>
          </h4>
          <SymbolButton
            opaque={true}
            name="trashFill"
            padding="25%"
            on:click={() => removeOverride(id)}></SymbolButton>
        </div>
      {/each}
      <div class="divider"></div>
    {/each}
  </div>
</div>

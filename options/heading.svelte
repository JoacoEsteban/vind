<script lang="ts">
  import Symbol from '~components/symbol.svelte'
  import type { SymbolName } from '~lib/symbols'

  export let title: string
  export let symbol: SymbolName | null
  export let classes = ''
</script>

<h2
  class="font-bold made-tommy flex gap-3 items-center justify-start {classes}">
  {#if symbol}
    <span>
      <Symbol name={symbol} size={'1em'} />
    </span>
  {/if}
  <span>{title}</span>
</h2>

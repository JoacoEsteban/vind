<script lang="ts">
  import Symbol from '~components/symbol.svelte'
  import type { SymbolName } from '~lib/symbols'

  export let title: string
  export let symbol: SymbolName | null
</script>

<h2 class="font-bold made-tommy flex gap-3 items-center justify-start">
  {#if symbol}
    <span>
      <Symbol name={symbol} size={'1em'} />
    </span>
  {/if}
  <span>{title}</span>
</h2>

<style lang="sass">
  h1, h2, h3, h4, h5, h6
    mix-blend-mode: color-dodge
</style>

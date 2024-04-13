<script lang="ts">
  import { symbols } from '~lib/symbols'

  export let size = '100%'
  export let name: keyof typeof symbols
  $: symbol = symbols[name]
</script>

<svg
  viewBox={`0 0 ${symbol.geometry.width} ${symbol.geometry.height}`}
  xmlns="http://www.w3.org/2000/svg"
  height={size}
  width={size}>
  <path
    fill="currentColor"
    d={symbol.path}
    fill-rule="evenodd"
    clip-rule="evenodd" />
</svg>

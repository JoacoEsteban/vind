<script lang="ts">
  import { symbols } from '~lib/symbols'

  export let size = '100%'
  export let name: keyof typeof symbols
  $: symbol = symbols[name]

  function getComputedSize(ratio: number) {
    if (ratio === 1) return size
    return `calc(${size} * ${ratio})`
  }
</script>

<svg
  viewBox={`0 0 ${symbol.geometry.width} ${symbol.geometry.height}`}
  xmlns="http://www.w3.org/2000/svg"
  style:margin="auto"
  height={getComputedSize(symbol.geometry.hRatio)}
  width={getComputedSize(symbol.geometry.wRatio)}>
  <path
    fill="currentColor"
    d={symbol.path}
    fill-rule="evenodd"
    clip-rule="evenodd" />
</svg>

<script lang="ts">
  import type { symbols } from '~lib/symbols'
  import Button from './button.svelte'
  import Symbol from './symbol.svelte'

  export let name: keyof typeof symbols
  export let size: string = '50px'
  export let padding: string = '15%'
  export let as: string = 'button'
  export let opaque: boolean = false
</script>

<Button
  {as}
  {opaque}
  round={true}
  roundSize={size}
  roundPadding={padding}
  on:click
  on:mouseover
  on:mouseleave
  on:focus
  on:blur>
  <Symbol {name} />
</Button>

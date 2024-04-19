<script lang="ts">
  import chroma from 'chroma-js'
  import ColorHash from 'color-hash'
  import { createEventDispatcher } from 'svelte'
  import { generateId } from '~lib/id'
  import { type SymbolName } from '~lib/symbols'
  import Symbol from './symbol.svelte'

  const colorHash = new ColorHash()

  export let colorSeed: string = generateId()
  export let round: boolean = false
  export let opaque: boolean = false
  export let highlight: boolean = false
  export let disabled: boolean = false
  export let icon: SymbolName | null = null
  export let roundSize: string = ''
  export let roundPadding: string = ''
  export let as: string = 'button'
  export let role: string = 'button'
  export let tabindex: number = 0

  const opacity = 0.5
  $: topGradient = chroma(colorHash.hex(colorSeed)).alpha(opacity).hex()
  $: bottomGradient = chroma(topGradient)
    .set('hsl.h', '+90')
    .alpha(opacity)
    .hex()
  $: focusColor = chroma(colorHash.hex(colorSeed)).brighten(1).hex()
  $: insetShadowColor = chroma(colorHash.hex(colorSeed))
    .brighten(1)
    .alpha(0.3)
    .hex()

  const dispatch = createEventDispatcher()
</script>

<div class="button-container">
  <svelte:element
    this={as}
    {role}
    {tabindex}
    class="outer f-center btn"
    class:round
    class:opaque
    class:highlight
    {disabled}
    style:--_gradient-top={topGradient}
    style:--_gradient-bottom={bottomGradient}
    style:--focus-color={focusColor}
    style:--inset-shadow-color={insetShadowColor}
    style:--_button-size_={roundSize}
    style:--_round-padding_={roundPadding}
    on:click={() => dispatch('click')}
    on:mouseover={() => dispatch('mouseover')}
    on:mouseleave={() => dispatch('mouseleave')}
    on:focus={() => dispatch('focus')}
    on:blur={() => dispatch('blur')}>
    <div class="inner flex gap-2 items-center">
      {#if icon}
        <Symbol name={icon} size={'1em'} />
      {/if}
      <slot />
    </div>
  </svelte:element>
</div>

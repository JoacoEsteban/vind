<script lang="ts">
  import chroma from 'chroma-js'
  import ColorHash from 'color-hash'
  import { createEventDispatcher } from 'svelte'

  const colorHash = new ColorHash()

  export let colorSeed: string = Date.now().toString()
  export let round: boolean = false
  export let roundSize: string = ''
  export let roundPadding: string = ''
  export let as: string = 'button'
  export let tabindex: number = 0

  const opacity = 0.5
  $: topGradient = chroma(colorHash.hex(colorSeed)).alpha(opacity).hex()
  $: bottomGradient = chroma(topGradient)
    .set('hsl.h', '+90')
    .alpha(opacity)
    .hex()

  const dispatch = createEventDispatcher()
</script>

<div class="button-container">
  <svelte:element
    this={as}
    role="button"
    {tabindex}
    class="outer f-center btn"
    class:round
    style="--_gradient-top: {topGradient}; --_gradient-bottom: {bottomGradient};"
    style:--_button-size_={roundSize}
    style:--_round-padding_={roundPadding}
    on:click={() => dispatch('click')}
    on:mouseover={() => dispatch('mouseover')}
    on:mouseleave={() => dispatch('mouseleave')}
    on:focus={() => dispatch('focus')}
    on:blur={() => dispatch('blur')}>
    <div class="inner f-center">
      <slot />
    </div>
  </svelte:element>
</div>

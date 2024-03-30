<script lang="ts">
  import chroma from 'chroma-js'
  import ColorHash from 'color-hash'
  import { createEventDispatcher } from 'svelte'

  const colorHash = new ColorHash()

  export let colorSeed: string = Date.now().toString()

  const opacity = 0.5
  $: topGradient = chroma(colorHash.hex(colorSeed)).alpha(opacity).hex()
  $: bottomGradient = chroma(topGradient)
    .set('hsl.h', '+90')
    .alpha(opacity)
    .hex()

  const dispatch = createEventDispatcher()
</script>

<div class="button-container">
  <button
    class="outer f-center btn"
    style="--_gradient-top: {topGradient}; --_gradient-bottom: {bottomGradient};"
    on:click={() => dispatch('click')}
    on:mouseover={() => dispatch('mouseover')}
    on:mouseleave={() => dispatch('mouseleave')}
    on:focus={() => dispatch('focus')}
    on:blur={() => dispatch('blur')}>
    <div class="inner f-center">
      <slot />
    </div>
  </button>
</div>

<script lang="ts">
  import chroma from 'chroma-js'
  import ColorHash from 'color-hash'
  import { createEventDispatcher } from 'svelte'
  import type { Binding } from '~lib/binding'

  const colorHash = new ColorHash()

  export let binding: Binding

  const opacity = 0.5
  $: topGradient = chroma(colorHash.hex(binding.key)).alpha(opacity).hex()
  $: bottomGradient = chroma(topGradient)
    .set('hsl.h', '+90')
    .alpha(opacity)
    .hex()

  const dispatch = createEventDispatcher()
  function onClick() {
    dispatch('click')
  }
</script>

<div class="binding-container">
  <button
    class="outer f-center"
    style="--_gradient-top: {topGradient}; --_gradient-bottom: {bottomGradient};"
    on:click={onClick}>
    <div class="inner f-center">
      {binding.key.toUpperCase()}
    </div>
  </button>
</div>

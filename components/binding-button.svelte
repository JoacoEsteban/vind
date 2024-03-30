<script lang="ts">
  import chroma from 'chroma-js'
  import ColorHash from 'color-hash'
  import { createEventDispatcher } from 'svelte'
  import type { Binding } from '~lib/binding'
  import Button from './button.svelte'

  const colorHash = new ColorHash()

  export let binding: Binding

  const dispatch = createEventDispatcher()
</script>

<div class="binding-container">
  <Button
    colorSeed={binding.key}
    on:click={() => dispatch('click')}
    on:mouseover={() => dispatch('focus')}
    on:mouseleave={() => dispatch('blur')}
    on:focus={() => dispatch('focus')}
    on:blur={() => dispatch('blur')}>
    {binding.key.toUpperCase()}
  </Button>
</div>

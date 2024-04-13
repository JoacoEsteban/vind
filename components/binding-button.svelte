<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Binding } from '~lib/binding'
  import { bindingKeySymbolMap } from '~lib/ui'
  import Button from './button.svelte'

  export let binding: Binding

  $: bindingKey =
    bindingKeySymbolMap.get(binding.key) || binding.key.toUpperCase()

  const dispatch = createEventDispatcher()
</script>

<div class="binding-container">
  <Button
    round={true}
    colorSeed={binding.key}
    on:click={() => dispatch('click')}
    on:mouseover={() => dispatch('focus')}
    on:mouseleave={() => dispatch('blur')}
    on:focus={() => dispatch('focus')}
    on:blur={() => dispatch('blur')}>
    {bindingKey}
  </Button>
</div>

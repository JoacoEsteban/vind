<script lang="ts">
  import { delay, filter, tap, type Observable } from 'rxjs'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import type { Binding } from '~lib/binding'
  import { Stack } from '~lib/rxjs'
  import { bindingKeySymbolMap } from '~lib/ui'
  import Button from './button.svelte'

  export let binding: Binding
  export let opaque: boolean = false
  export let disabled: boolean = false
  export let ping: boolean = false
  export let triggeredBinding$: Observable<string> | null = null

  const stack = Stack()
  const pressed$ = stack.full$

  $: bindingKey =
    bindingKeySymbolMap.get(binding.key) || binding.key.toUpperCase()

  $: triggeredBinding$
    ?.pipe(
      filter((triggeredBinding) => triggeredBinding === binding.key),
      tap(stack.push),
      delay(400),
      tap(stack.pop),
    )
    .subscribe()

  const dispatch = createEventDispatcher()

  onDestroy(() => {
    stack.complete()
  })
</script>

<div class="binding-container">
  <Button
    round={true}
    {disabled}
    {opaque}
    pressed={$pressed$}
    colorSeed={binding.key}
    ping={ping && !disabled}
    on:click={() => dispatch('click')}
    on:mouseenter={() => dispatch('focus')}
    on:mouseleave={() => dispatch('blur')}
    on:focus={() => dispatch('focus')}
    on:blur={() => dispatch('blur')}>
    {bindingKey}
  </Button>
</div>

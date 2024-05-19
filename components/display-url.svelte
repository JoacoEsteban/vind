<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { identity } from '~lib/misc'
  import { wrapIterable } from '~lib/svelte'
  import { Domain, Path } from '~lib/url'

  export let domain: Domain | null = null
  export let path: Path | null = null
  export let size: string = 'text-sm'
  export let weight: 'normal' | 'bold' = 'bold'
  export let maxPathCharLength: number = Infinity
  export let editable = false

  $: role = editable ? 'button' : undefined

  const dispatch = createEventDispatcher<{
    updatePath: { path: Path }
  }>()

  $: {
    if (!domain && !path) {
      throw new Error('Either domain or path must be provided')
    }
  }

  $: pathParts = (path?.value && path.value.split('/')) || []
  $: classes = [
    'flex',
    'flex-wrap',
    'max-w-full',
    'items-center',
    'space-x-1',
    'made-tommy',
    `font-${weight}`,
    size,
  ].join(' ')

  const greySpan = (text: string) => `<span class="opacity-50">${text}</span>`

  const doTrim = (part: string) => {
    return part.length > maxPathCharLength
      ? part.slice(0, maxPathCharLength) + '…'
      : part
  }

  $: trim = maxPathCharLength === Infinity ? identity : doTrim

  function togglePart(index: number) {
    if (!editable) {
      return
    }

    if (!path) {
      throw new Error('Path must be provided')
    }

    dispatch('updatePath', {
      path: path.makeGlob(index),
    })
  }
</script>

<div class={classes}>
  {#if domain}
    <span>{domain.value}</span>
  {/if}

  {#if path}
    {@html greySpan('/')}
  {/if}

  {#each wrapIterable(pathParts) as { item: part, last, index }}
    <div {role} on:click={() => togglePart(index)}>{trim(part)}</div>
    {#if !last}
      {@html greySpan('/')}
    {/if}
  {/each}
</div>

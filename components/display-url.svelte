<script lang="ts">
  import { identity } from '~lib/misc'
  import { wrapIterable } from '~lib/svelte'
  import { Domain, Path } from '~lib/url'

  export let domain: Domain | null = null
  export let path: Path | null = null
  export let size: string = 'text-sm'
  export let weight: 'normal' | 'bold' = 'bold'
  export let maxPathCharLength: number = Infinity

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
</script>

<div class={classes}>
  {#if domain}
    <span>{domain.value}</span>
  {/if}

  {#if path}
    {@html greySpan('/')}
  {/if}

  {#each wrapIterable(pathParts) as { item: part, last }}
    <span>{trim(part)}</span>
    {#if !last}
      {@html greySpan('/')}
    {/if}
  {/each}
</div>

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { identity } from '~lib/misc'
  import { ToggleSubject } from '~lib/rxjs'
  import { wrapIterable } from '~lib/svelte'
  import { Domain, Path } from '~lib/url'
  import Button from './button.svelte'
  import Symbol from './symbol.svelte'
  import WithTooltip from './with-tooltip.svelte'

  export let domain: Domain | null = null
  export let path: Path | null = null
  export let size: string = 'text-sm'
  export let weight: 'normal' | 'bold' = 'bold'
  export let maxPathCharLength: number = Infinity
  export let editable = false

  const hide$ = new ToggleSubject()
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

  const greySpan = (text: string) =>
    `<span class="opacity-50 blend cursor-default">${text}</span>`

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

  function editPart(index: number) {
    if (!editable) {
      return
    }

    if (!path) {
      throw new Error('Path must be provided')
    }

    const part = pathParts[index]

    if (!part) {
      throw new Error('Path must be provided')
    }

    const edited = prompt('Edit path part', part)

    if (!edited) {
      return
    }

    dispatch('updatePath', {
      path: path.replacePart(index, edited),
    })
  }

  function removeLast() {
    if (!editable) {
      return
    }

    if (!path) {
      throw new Error('Path must be provided')
    }

    dispatch('updatePath', {
      path: path.removeGlobbedTail(),
    })
  }
</script>

<div class={classes}>
  {#if domain}
    <span class="cursor-default">{domain.value}</span>
  {/if}

  {#if path}
    {@html greySpan('/')}
  {/if}

  {#each wrapIterable(pathParts) as { item: part, last, index }}
    <WithTooltip
      placement="top"
      bordered
      hideSignal={$hide$}
      enabled={editable}>
      <div class="part blend cursor-default">
        {#if part === '*'}
          <Symbol size=".75em" name="asterisk" />
        {:else}
          {trim(part)}
        {/if}
      </div>
      <div slot="tooltip" class="flex gap-3">
        <Button opaque icon={'pencil'} on:click={() => editPart(index)}>
          Edit
        </Button>
        {#if part !== '*'}
          <Button
            icon={'asteriskCircleFill'}
            opaque
            on:click={() => {
              hide$.toggle()
              togglePart(index)
            }}>
            Wildcard
          </Button>
        {:else if last}
          <Button opaque icon={'trashFill'} on:click={removeLast}>
            Remove
          </Button>
        {/if}
      </div>
    </WithTooltip>
    {#if !last}
      {@html greySpan('/')}
    {/if}
  {/each}
</div>

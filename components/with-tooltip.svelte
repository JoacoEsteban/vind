<script lang="ts">
  import { createFloatingActions } from 'svelte-floating-ui'
  import { flip, shift } from 'svelte-floating-ui/dom'
  import { circIn, circOut } from 'svelte/easing'
  import { fade, scale, type TransitionConfig } from 'svelte/transition'
  import { transitionIn, transitionOut } from '~lib/transitions'

  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'top'
  export let bordered = false
  export let enabled = true
  export let hideSignal: boolean = false

  $: (hideSignal || true) && hideTooltip()

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement,
    middleware: [flip(), shift()],
  })

  let hoverTarget: HTMLElement | null = null
  let tooltipEl: HTMLElement | null = null
  let tooltipAnchor: HTMLElement | null = null
  $: showTooltip = Boolean(enabled && hoverTarget)

  function onHover({ target }: MouseEvent) {
    if (!enabled) return
    hoverTarget = target as HTMLElement
  }

  function onLeave({ target }: MouseEvent) {
    setTimeout(() => {
      if (hoverTarget === target) hideTooltip()
    })
  }

  function hideTooltip() {
    hoverTarget = null
  }
</script>

<div
  role="none"
  class="wrapper"
  bind:this={tooltipAnchor}
  on:mouseenter={onHover}
  on:mouseleave={onLeave}
  use:floatingRef>
  <slot />
</div>

{#if showTooltip}
  <div
    bind:this={tooltipEl}
    on:mouseenter={onHover}
    on:mouseleave={onLeave}
    use:floatingContent
    role="tooltip"
    style:position="absolute"
    style:padding="8px"
    style:z-index="1000"
    class={bordered ? 'bg-blur bg-blur:soft bg-blur:round' : ''}
    in:transitionIn
    out:transitionOut>
    <slot name="tooltip" />
  </div>
{/if}

<style lang="scss">
  .wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-width: 1em;
  }
</style>

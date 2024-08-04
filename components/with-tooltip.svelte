<script lang="ts">
  import { createFloatingActions } from 'svelte-floating-ui'
  import { flip, shift } from 'svelte-floating-ui/dom'
  import { circIn, circOut } from 'svelte/easing'
  import { fade, scale, type TransitionConfig } from 'svelte/transition'

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

  function tooltipTransition(easing = circOut, duration = 200) {
    return function (node: Element, { delay = 0 } = {}): TransitionConfig {
      const anims: ((t: number, u: number) => string)[] = []
      anims.push(fade(node, { duration, easing }).css!)
      anims.push(scale(node, { start: 0.8, duration, easing }).css!)

      return {
        delay,
        duration,
        easing,
        css: (t, u) => anims.map((a) => a(t, u)).join('; '),
      }
    }
  }

  const trIn = tooltipTransition()
  const trOut = tooltipTransition(circIn, 100)
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
    in:trIn
    out:trOut>
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

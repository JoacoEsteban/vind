<script lang="ts">
  import { createFloatingActions } from 'svelte-floating-ui'
  import { flip, shift } from 'svelte-floating-ui/dom'
  import { circIn, circOut } from 'svelte/easing'
  import { fade, scale, type TransitionConfig } from 'svelte/transition'

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement: 'top',
    middleware: [flip(), shift()],
  })

  let hoverTarget: HTMLElement | null = null
  let tooltipEl: HTMLElement | null = null
  let tooltipAnchor: HTMLElement | null = null
  $: showTooltip = Boolean(hoverTarget)

  function onHover({ target }: MouseEvent) {
    hoverTarget = target as HTMLElement
  }

  function onLeave({ target }: MouseEvent) {
    setTimeout(() => {
      if (hoverTarget === target) hoverTarget = null
    })
  }

  function tooltipTransition(easing = circOut, duration = 200) {
    return function (node: Element, { delay = 0 } = {}): TransitionConfig {
      const f = fade(node, { duration, easing }).css!
      const s = scale(node, { start: 0.8, duration, easing }).css!

      return {
        delay,
        duration,
        easing,
        css: (t, u) => [f(t, u), s(t, u)].join(';'),
      }
    }
  }

  const trIn = tooltipTransition()
  const trOut = tooltipTransition(circIn, 100)
</script>

<div
  role="none"
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
    in:trIn
    out:trOut>
    <slot name="tooltip" />
  </div>
{/if}

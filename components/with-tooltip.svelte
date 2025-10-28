<script lang="ts">
  import { createFloatingActions } from 'svelte-floating-ui'
  import {
    flip,
    shift,
    offset as offsetMiddleware,
  } from 'svelte-floating-ui/dist/dom'
  import { noop, tupleNotNull } from '~lib/misc'
  import { handleExitPolygon, PolygonState } from '~lib/safe-polygon'
  import { transitionIn, transitionOut } from '~lib/transitions'
  import { BehaviorSubject, distinctUntilChanged, of, switchMap } from 'rxjs'
  import { match } from 'ts-pattern'
  import { onDestroy } from 'svelte'
  import { DisposeBag } from '~lib/dispose-bag'

  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'top'
  export let bordered = false
  export let enabled = true
  export let hideSignal: boolean = false
  export let offset = 10

  $: (hideSignal || true) && hideTooltip()

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement,
    middleware: [flip(), shift(), offsetMiddleware(offset)],
  })

  let hoverTarget: HTMLElement | null = null
  let tooltipEl: HTMLElement | null = null
  let tooltipAnchor: HTMLElement | null = null
  $: showTooltip = Boolean(enabled && hoverTarget)

  function setHoverTarget({ target }: MouseEvent) {
    if (!enabled) return
    hoverTarget = target as HTMLElement
  }

  function hideTooltip() {
    hoverTarget = null
  }

  const { sink, dispose } = new DisposeBag()
  onDestroy(dispose)

  const elemTargets$ = new BehaviorSubject<
    [HTMLElement | null, HTMLElement | null]
  >([null, null])

  $: {
    const [from, tooltip, anchor] = [hoverTarget, tooltipEl, tooltipAnchor]
    const to = match(from)
      .with(null, () => null)
      .when(
        (target) => target === anchor,
        () => tooltip,
      )
      .when(
        (target) => target === tooltip,
        () => anchor,
      )
      .run()

    elemTargets$.next([from, to])
  }

  elemTargets$
    .pipe(
      distinctUntilChanged(
        ([from, to], [prevFrom, prevTo]) => from === prevFrom && to === prevTo,
      ),
      switchMap(([from, to]) =>
        match([from, to])
          .when(
            tupleNotNull<readonly [HTMLElement | null, HTMLElement | null]>,
            ([from, to]) => handleExitPolygon(from, to),
          )
          .otherwise(() => of(PolygonState.Idle)),
      ),
      sink(),
    )
    .subscribe((state) => {
      match(state).with(PolygonState.Exit, hideTooltip).otherwise(noop)
    })
</script>

<div
  role="none"
  class="wrapper"
  bind:this={tooltipAnchor}
  on:mouseenter={setHoverTarget}
  use:floatingRef>
  <slot />
</div>

{#if showTooltip}
  <div
    bind:this={tooltipEl}
    on:mouseenter={setHoverTarget}
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

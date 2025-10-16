<script lang="ts">
  import { RegistrationController } from '~/lib/registration-controller'
  import { transitionIn, transitionOut } from '~lib/transitions'
  import { map, switchMap } from 'rxjs'
  import type { PageController } from '~lib/page-controller'

  export let registrationControllerInstance: RegistrationController
  export let pageControllerInstance: PageController

  const styles$ = registrationControllerInstance.registrationInProgress$.pipe(
    switchMap((registering) =>
      registering
        ? registrationControllerInstance.currentElementSelectionTarget$
        : pageControllerInstance.focusedBindingElement$,
    ),
    map((target) => {
      return (
        target && {
          style: getComputedStyle(target),
          bounds: target.getBoundingClientRect(),
        }
      )
    }),
  )
</script>

{#if $styles$}
  <div
    class="fixed flex overflow-hidden pointer-events-none overlay"
    in:transitionIn
    out:transitionOut
    style:top={$styles$.bounds.top + 'px'}
    style:left={$styles$.bounds.left + 'px'}
    style:width={$styles$.bounds.width + 'px'}
    style:height={$styles$.bounds.height + 'px'}
    style:border-radius={$styles$.style.borderRadius}>
  </div>
{/if}

<style lang="scss" scoped>
  .overlay {
    $base-hue: 130;
    $ping-color: hsla($base-hue + 30 100% 95%);
    $background-color: hsla($base-hue 100% 50% / 0.2);
    $border-color: hsla($base-hue + 15 100% 80%);
    $glow-color: hsla($base-hue + 30 100% 60% / 0.2);

    transition: 0.2s var(--bezier);
    transition-property: top, left, width, height;

    background-color: $background-color;
    border: 2px solid $border-color;
    box-shadow: 0 0 30px 5px $glow-color;

    @keyframes ping {
      75%,
      100% {
        opacity: 0;
      }
    }

    &::before {
      pointer-events: none;
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: $ping-color;
      animation: ping 2s linear infinite;
    }
  }
</style>

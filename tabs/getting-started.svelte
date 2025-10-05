<script lang="ts">
  import '~/lib/fonts-importer'
  import styleText from 'data-text:~/style.scss'
  import { BehaviorSubject, map, share, startWith } from 'rxjs'
  import chroma from 'chroma-js'
  import CrabsScene from '~three/lib/components/CrabsScene.svelte'
  import Popup from '~components/popup.svelte'
  import { PageController } from '~lib/page-controller'
  import Button from '~components/button.svelte'
  import { ToggleSubject, VoidSubject } from '~lib/rxjs'
  import { MemoryBindingChannelImpl } from '~lib/messages/bindings'
  import { DocumentClient } from '~contents/document-client'
  import Toaster from '~components/toaster.svelte'
  import Filters from '~components/filters.svelte'
  import { themeController } from '~lib/theme-controller'
  import { MemoryDisabledPathsChannelImpl } from '~lib/messages/disabled-paths'
  import VindLogo from '~components/vind-logo.svelte'
  import { useTransitions } from '~lib/transitions'
  import { RegistrationState } from '~lib/registration-controller'
  import { wrapIterable } from '~lib/svelte'
  import { generateId } from '~lib/id'
  import OverlayTarget from '~components/overlay-target.svelte'
  import { TestId } from '~lib/test-id'

  const style = document.createElement('style')
  style.textContent = styleText
  document.head.appendChild(style)

  const transitionArgs = {
    duration: 750,
    scaleStart: 0.95,
  }
  const states = [
    {
      state: RegistrationState.Idle,
      content: `Open the popup and Click <b>Bind</b>`,
    },
    {
      state: RegistrationState.SelectingElement,
      content: `Click on <b>some button</b> below`,
    },
    {
      state: RegistrationState.SelectingKey,
      content: `Press the <b>key</b> you want to bind it to`,
    },
  ]

  function getDelay(index: number) {
    return (transitionArgs.duration / 15) * index
  }

  function register() {
    bindingCompleted = false
    client.registerNewBinding()?.then(() => {
      bindingCompleted = true
    })
  }

  const { in: transitionIn, out: transitionOut } =
    useTransitions(transitionArgs)
  const { in: maskIn, out: maskOut } = useTransitions({
    animations: ['fade'],
  })

  const client = new DocumentClient(
    new PageController(
      new MemoryBindingChannelImpl(),
      new MemoryDisabledPathsChannelImpl(),
      'content-script',
      new URL('https://vind-works.io/getting-started'),
    ),
  )

  const { pageControllerInstance, registrationControllerInstance } = client
  const registering$ = registrationControllerInstance.registrationInProgress$
  const registrationState$ =
    client.registrationControllerInstance.registrationState$
  const bindingsLenght$ = pageControllerInstance.bindings$.pipe(
    map((b) => b.length),
  )
  const spin$ = new VoidSubject()
  let visible = false
  let showUI = false
  setTimeout(() => (showUI = true), 500)
  let bindingCompleted = true

  const changeColor$ = new VoidSubject()
  const changeBloom$ = new ToggleSubject()
  const bloom$ = changeBloom$.asObservable()
  const colorSeed$ = changeColor$.pipe(
    map(() => generateId()),
    startWith(localStorage.getItem('colorSeed') ?? generateId()),
    share(),
  )
  const color$ = new BehaviorSubject('')
  const dodgeColor$ = color$.pipe(
    map((color) =>
      chroma(color || '#aaa')
        .set('hsl.l', '.75')
        .hex(),
    ),
  )

  colorSeed$.subscribe((c) => {
    localStorage.setItem('colorSeed', c)
  })

  $: showBindingInstructions = $bindingsLenght$ > 0
  $: showingMask =
    !bindingCompleted ||
    [
      RegistrationState.SelectingElement,
      RegistrationState.SelectingKey,
    ].includes($registrationState$)

  $: {
    bindingCompleted = !visible
  }

  const colorLabelTestId = new TestId('getting-started:color-label')
</script>

<CrabsScene
  {spin$}
  colorSeed={$colorSeed$}
  onColorChange={(color) => color$.next(color)} />
<div use:themeController>
  <div
    class="vind-ignore-self bg-theme:soft fixed top-0 left-0 right-0 bottom-0">
  </div>
</div>

<div
  use:themeController
  class="vind-ignore-self"
  style:--dodge-color={$dodgeColor$}>
  <div class="relative space-y-6 made-tommy p-8 h-screen vind-ignore-self">
    {#if showUI}
      {@const layout = (classes = '') =>
        'flex flex-col gap-4 xl:[&_h2]:text-[4rem] md:[&_h2]:text-[3rem] [&_h2]:text-[2rem] [&_h2]:leading-[1] [&_h2]:font-medium max-xl:items-end max-xl:text-right' +
        ' ' +
        classes}
      <div
        class="w-full space-y-3 xl:grid grid-cols-3 !text-white vind-ignore-*">
        <div
          class={layout('items-end text-right origin-top-right col-start-3')}>
          <h1
            class="leading-[1] text-[4rem] xl:text-[8rem] font-medium flex gap-5 items-center">
            <div in:transitionIn class="dodge">Vind</div>
            <span in:transitionIn>
              <VindLogo />
            </span>
          </h1>

          <span
            in:transitionIn={{ delay: getDelay(1) }}
            data-testid={colorLabelTestId.id}
            class="text-[2rem] leading-[1] opacity-50 font-medium dodge">
            {$color$}
          </span>

          <h2
            in:transitionIn={{ delay: getDelay(2) }}
            class="leading-[1] font-medium">
            Test it out
          </h2>

          <div class="xl:text-3xl text-2xl font-regular [&>div]:relative">
            {#each wrapIterable(states) as { item, index } (index)}
              {#await Promise.resolve() then _}
                <div
                  in:transitionIn={{
                    delay: getDelay(index + 3),
                  }}
                  class="highlight"
                  class:v_toggle-availability={!bindingCompleted ||
                    $registering$}
                  class:enabled={$registrationState$ === item.state}>
                  {@html item.content}
                </div>
              {/await}
            {/each}
          </div>
        </div>

        {#if showBindingInstructions}
          <div class={layout('max-xl:items-end max-xl:text-right')}>
            <h2 in:transitionIn={{ delay: 200 }} class="mt-2">
              Try your new binding
            </h2>
            <div
              in:transitionIn={{ delay: 200 }}
              class="xl:text-3xl text-2xl font-regular [&>div]:relative">
              <div>
                Now you can either <b>press the key</b> or
                <b>click on the button in the popup</b> to trigger the binding
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div
        in:transitionIn={{ delay: getDelay(3 + states.length) }}
        out:transitionOut
        class="xl:fixed xl:w-screen xl:h-screen max-xl:!mt-24 top-0 left-0 flex items-center justify-center v_toggle-visibility pointer-events-none"
        class:enabled={!visible}>
        <div
          class="relative xl:zoom-200 sm:zoom-150 pointer-events-auto vind-ignore-self">
          <Button
            on:click={() => (visible = true)}
            colorSeed={$colorSeed$}
            ping
            testId={new TestId('getting-started:open-popup-button')}
            >Open</Button>
        </div>
      </div>

      {@const highlightLaunchpad =
        $registrationState$ === RegistrationState.SelectingElement}
      <div
        in:transitionIn={{ delay: getDelay(4 + states.length) }}
        out:transitionOut
        class:highlight={highlightLaunchpad}
        class="fixed bottom-0 origin-bottom-left left-0 w-screen vind-ignore-self actions-container">
        <div
          class="flex flex-col gap-3 justify-center items-center w-fit m-auto ml-[20px] my-6 py-4 px-5 bg-blur vind-ignore-self">
          <h4 class="text-2xl font-medium">Launchpad</h4>

          <div class="flex gap-3 justify-center items-center vind-ignore-self">
            <Button
              icon="arrowClockwise"
              on:click={() => spin$.next()}
              testId={new TestId('getting-started:spin-button')}
              ping={highlightLaunchpad}>Spin</Button>

            <Button
              icon="paintPalette"
              on:click={() => changeColor$.next()}
              disabled={$bloom$}
              testId={new TestId('getting-started:color-button')}
              ping={highlightLaunchpad}>Color</Button>
          </div>
        </div>
      </div>
    {/if}

    {#if showingMask}
      <div class="mask-overlay !m-0 vind-ignore-self" in:maskIn out:maskOut>
      </div>
    {/if}

    <div
      class="absolute zoom-110"
      class:highlight={$registrationState$ === RegistrationState.Idle}>
      <Popup
        {visible}
        disabled={$registering$}
        {pageControllerInstance}
        on:registerNewBinding={register}
        position={{
          x: 'center',
          y: 'center',
        }}
        close={() => (visible = false)}
        bindingsPing
        buttonPing={showingMask} />
    </div>

    <Filters />

    <div class="absolute" style="z-index: 9999999999;">
      <Toaster />
      <OverlayTarget
        {registrationControllerInstance}
        {pageControllerInstance} />
    </div>
  </div>
</div>

<style lang="scss" scoped>
  .mask-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    pointer-events: none;
  }
  .highlight {
    z-index: 10000;
    color: white;
  }
  .dodge {
    mix-blend-mode: color-dodge;
    color: var(--dodge-color);
  }
</style>

<script lang="ts">
  import '~/style.sass'
  import '~/lib/fonts-importer'
  import chroma from 'chroma-js'
  import githubMark from 'data-text:~assets/svg/github-mark.svg'
  import { first, map, share } from 'rxjs'
  import logo from '~/assets/icon.png'
  import BindingButton from '~components/binding-button.svelte'
  import Button from '~components/button.svelte'
  import DisplayUrl from '~components/display-url.svelte'
  import Filters from '~components/filters.svelte'
  import SymbolButton from '~components/symbol-button.svelte'
  import WithTooltip from '~components/with-tooltip.svelte'
  import { handleAnimationState } from '~lib/animation-state'
  import { Binding } from '~lib/binding'
  import { cursorPosition, mouse$ } from '~lib/cursor-position'
  import { log } from '~lib/log'
  import { MapToOrderedTuple } from '~lib/map'
  import { openGithub } from '~lib/misc'
  import { PageController } from '~lib/page-controller'
  import type { SymbolName } from '~lib/symbols'
  import { themeController } from '~lib/theme-controller'
  import { Domain, Path, safeUrl } from '~lib/url'
  import { wakeUp } from '~messages/tabs'

  const pageController = new PageController('options')
  pageController.refreshResources()

  wakeUp.stream.subscribe(() => {
    log.info('Waking up options page')
    pageController.refreshResources()
  })

  const options: {
    name: string
    key: string
    icon: SymbolName
  }[] = [
    {
      name: 'Bindings',
      key: 'bindings',
      icon: 'link',
    },
    {
      name: 'Overrides',
      key: 'overrides',
      icon: 'arrowTriangleBranch',
    },
  ]
  let activeKey = options[0].key

  const onMouse = mouse$.pipe(first())
  const bindingsMap = pageController.bindingsByPathMap$.pipe(
    map((map) => {
      return MapToOrderedTuple(map, (a, b) => a.localeCompare(b)).map<
        [string, [string, Binding[]][]]
      >(([key, map]) => [
        key,
        MapToOrderedTuple(map, (a, b) => a.localeCompare(b)),
      ])
    }),
    share(),
  )
  const overridesMap = pageController.overridesByPathMap$
  const { bg1, bg2 } = (() => {
    const base = chroma.random()
    const darkFactor = -1
    const bg1 = base.brighten(darkFactor)
    const bg2 = base.set('hsl.h', '+25').darken(darkFactor)

    return { bg1, bg2 }
  })()

  async function deleteBinding(binding: Binding) {
    pageController.bindingsChannel.removeBinding(binding.id)
  }
  async function removeOverride(id: number) {
    pageController.overridesChannel.removePageOverride(id)
  }

  function getOverrideBehavior(domain: string, overridePath: string) {
    const target = new Path(domain)
    const source = new Path(overridePath)

    return target.includes(source) ? behaviors.disabled : behaviors.enabled
  }

  const behaviors = {
    enabled: 'Enabled',
    disabled: 'Disabled',
  }
</script>

<div use:themeController use:cursorPosition>
  <div class="options-container p-5 h-screen drawer lg:drawer-open">
    <div
      use:handleAnimationState
      class="backdrop"
      style:--_bg-1={bg1.hex()}
      style:--_bg-2={bg2.hex()}>
      <div class="v_toggle-visibility w-full h-full" class:enabled={$onMouse}>
        <div
          use:handleAnimationState
          class="mosaic"
          style:background-image={`url(${logo})`}>
        </div>
      </div>
    </div>
    <input id="drawer" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content max-w-3xl mx-auto pt-10 px-5">
      <main class="prose prose-2xs max-w-full">
        <div class="sm:flex align-center justify-between mb-4">
          <h1 class="font-black">Vind Options</h1>
          <div class="flex align-center gap-3">
            <Button
              opaque={true}
              round={true}
              roundSize="50px"
              on:click={openGithub}
              roundPadding="15%">
              {@html githubMark}
            </Button>
          </div>
        </div>
        <div role="tablist" class="flex gap-2">
          {#each options as option}
            <Button
              opaque={true}
              role="tab"
              highlight={activeKey === option.key}
              on:click={() => (activeKey = option.key)}
              icon={option.icon}>
              {option.name}
            </Button>
          {/each}
        </div>
        {#if activeKey === 'bindings'}
          <div class="">
            <div>
              <h2 class="font-bold made-tommy">
                {#if $bindingsMap.length === 0}
                  No bindings found
                {:else}
                  Bindings
                {/if}
              </h2>

              {#each $bindingsMap as [domain, map]}
                <h5 class="mb-3">
                  <DisplayUrl domain={new Domain(domain)} size={'text-2xl'} />
                </h5>
                {#each map as [path, bindings]}
                  <h5 class="w-full flex mb-3">
                    <!-- <b> <DisplayUrl {url} /> </b> -->
                    <DisplayUrl path={new Path(path)} size={'text-l'} />
                  </h5>
                  <div class="flex mb-5 flex-wrap gap-3">
                    {#each bindings as binding (binding.id)}
                      <span>
                        <WithTooltip placement="bottom">
                          <BindingButton opaque={true} {binding} />
                          <div slot="tooltip">
                            <Button
                              colorSeed={binding.key}
                              opaque={true}
                              icon={'trashFill'}
                              on:click={() => deleteBinding(binding)}>
                              Remove
                            </Button>
                          </div>
                        </WithTooltip>
                      </span>
                    {/each}
                  </div>
                {/each}
              {/each}
            </div>
          </div>
        {/if}
        {#if activeKey === 'overrides'}
          <div class="container">
            <div>
              <h2 class="font-bold made-tommy">
                {#if $overridesMap.size === 0}
                  No Overrides found
                {:else}
                  Overrides
                {/if}
              </h2>

              {#each $overridesMap as [domain, overrides]}
                <h3 class="w-full flex mb-3">
                  on &nbsp;

                  <a href={safeUrl(domain).href} target="_blank">
                    <DisplayUrl
                      domain={new Domain(domain)}
                      path={new Path(domain)}
                      size={'text-l'} />
                  </a>
                </h3>
                {#each overrides as [id, path]}
                  <div class="flex">
                    <h4
                      class="w-full flex items-center flex-wrap gap-1 mb-3 mt-0">
                      bindings from <DisplayUrl
                        path={new Path(path)}
                        size={'text-l'} />are
                      <b>{getOverrideBehavior(domain, path)}</b>
                    </h4>
                    <SymbolButton
                      opaque={true}
                      name="trashFill"
                      padding="25%"
                      on:click={() => removeOverride(id)}></SymbolButton>
                  </div>
                {/each}
                <div class="divider"></div>
              {/each}
            </div>
          </div>
        {/if}
      </main>
    </div>
  </div>
  <Filters />
</div>

<style lang="sass">
h1, h2, h3, h4, h5, h6
  mix-blend-mode: color-dodge

.backdrop
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  z-index: -1

  background: linear-gradient(180deg, var(--_bg-1, #1e3a8a) 0%, var(--_bg-2, #f544f5) 100%)
  animation: hue-rotate 10s infinite
  @keyframes hue-rotate
    0%
      filter: hue-rotate(0deg)
    100%
      filter: hue-rotate(360deg)
  &::after
    content: ''
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100%
    background: var(--fallback-b1, oklch(var(--b1) / 1))
    opacity: 0.4
    z-index: 1

.drawer-content
  width: min(80em, 100%)

.mosaic
  --mosaic-size-from: 200px
  --mosaic-size-to: 210px
  // --x: calc(var(--mouse-x) * calc(var(--mouse-x)/50))
  --x: var(--mouse-x)
  // --y: calc(var(--mouse-y) * calc(var(--mouse-y)/50))
  --y: var(--mouse-y)
  
  width: 100%
  height: 100%
  opacity: 0.3

  transition: background-position .01s

  background-position: var(--x) var(--y)
  background-repeat: repeat

  animation: 5s infinite size var(--bezier-symmetric)

  animation-fill-mode: backwards

  @keyframes size
    0%
      background-size: var(--mosaic-size-from)
      filter: blur(23px)
    50%
      background-size: var(--mosaic-size-to)
      filter: blur(3px)
    100%
      background-size: var(--mosaic-size-from)
      filter: blur(23px)
</style>

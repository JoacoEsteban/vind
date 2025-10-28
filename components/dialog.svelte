<script lang="ts">
  import { merge } from 'rxjs'
  import { quintOut } from 'svelte/easing'
  import { fade, scale } from 'svelte/transition'
  import { match } from 'ts-pattern'
  import { colorSeeds } from '~lib/definitions'
  import { autofocus } from '~lib/autofocus'
  import {
    BooleanPrompt$,
    Prompt$,
    PromptType,
    type AnyPrompt,
    type AnyReturnOfPrompt,
    type Prompt,
  } from '~lib/dialog'
  import { waitForKey } from '~lib/element'
  import { noop, promiseToSignal } from '~lib/misc'
  import Button from './button.svelte'
  import Symbol from './symbol.svelte'

  let open = false
  let prompt: AnyPrompt | null = null
  let input: AnyReturnOfPrompt | null = null
  let type: PromptType | null = null

  $: isError =
    type === PromptType.PathEdit
      ? typeof input !== 'string' ||
        input.includes(' ') ||
        input.includes('/') ||
        input.includes('\\') ||
        input.includes(':')
      : false

  $: isValid = match(type)
    .with(PromptType.Boolean, () => true)
    .with(
      PromptType.PathEdit,
      () =>
        !isError &&
        (input as string).length > 0 &&
        input !== prompt?.options.value,
    )
    .otherwise(() => false)

  // TODO try to çouple this into one
  merge(Prompt$, BooleanPrompt$).subscribe(async (_prompt) => {
    prompt = _prompt
    open = true
    input = prompt?.options.value || ''
    type = prompt?.options.type

    document.body.classList.add('dialog-open')
    waitForKey('Escape', promiseToSignal<any>(prompt.promise))
      .then(cancel)
      .catch(noop)
      .finally(reset)
  })

  function cancel() {
    prompt?.reject(null)
  }

  function confirm() {
    if (!isValid) return
    if (!prompt || !type) return

    match(type)
      .with(PromptType.Boolean, () => {
        ;(prompt as Prompt<PromptType.Boolean>).resolve(true)
      })
      .with(PromptType.PathEdit, () => {
        ;(prompt as Prompt<PromptType.PathEdit>).resolve(input as string)
      })
  }

  function makeWildcard() {
    if (type !== PromptType.PathEdit) throw new Error('Invalid type')
    if (!prompt) throw new Error('No prompt')
    ;(prompt as Prompt<PromptType.PathEdit>).resolve('*')
  }

  function backdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancel()
    }
  }

  function reset() {
    document.body.classList.remove('dialog-open')
    open = false
    prompt = null
  }
</script>

{#if open}
  <div
    class="relative z-10 made-tommy"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true">
    <div
      role="button"
      tabindex="-1"
      aria-label="Close dialog"
      transition:fade
      on:click={cancel}
      on:keydown={backdropKeydown}
      class="fixed inset-0 bg-neutral bg-opacity-50 transition-opacity">
    </div>

    <div
      class="fixed inset-0 z-10 w-screen overflow-y-auto pointer-events-none">
      <div
        tabindex="-1"
        class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          transition:scale={{
            duration: 500,
            easing: quintOut,
            start: 0.85,
            opacity: 0,
          }}
          class="relative transform overflow-hidden rounded-lg bg-blur bg-blur:soft text-left shadow-xl sm:my-8 w-full sm:max-w-2xl flex flex-col gap-10 pointer-events-auto">
          <div class="px-4 pb-0 pt-5 sm:p-6 sm:pb-0">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <Symbol name={prompt?.options.symbol || 'pencilCircleFill'} />
              </div>
              {#if prompt?.options.title}
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h2
                    class="m-0 font-medium text-3xl sm:text-3xl"
                    id="modal-title">
                    {@html prompt?.options.title}
                  </h2>
                  {#if prompt?.options.subtitle}
                    <h3 class="mt-0 font-normal sm:text-lg">
                      {@html prompt?.options.subtitle}
                    </h3>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          {#if type === PromptType.PathEdit}
            <form
              class="mt-3 text-center sm:text-left px-4 sm:px-6 pb-4"
              on:submit|preventDefault={confirm}>
              <input
                use:autofocus
                class="input input-bordered w-full !bg-[#fff4] rounded-full text-xl font-medium text-center"
                type="text"
                placeholder={prompt?.options.placeholder || 'Enter text'}
                class:input-error={isError}
                bind:value={input} />
            </form>
          {/if}
          <div
            class="px-4 py-3 flex flex-col sm:flex-row flex-wrap sm:px-6 gap-2 justify-between">
            {#if type === PromptType.PathEdit}
              <Button
                on:click={makeWildcard}
                icon="asteriskCircleFill"
                type="button">Match All</Button>
            {/if}
            <div
              class="flex flex-row flex-wrap gap-2 justify-center sm:justify-end">
              <Button
                on:click={cancel}
                type="button"
                colorSeed={colorSeeds.redCancel}>Cancel</Button>
              <Button
                on:click={confirm}
                type="button"
                disabled={!isValid}
                colorSeed={colorSeeds.greenAccept}>Confirm</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  input,
  input:focus {
    box-shadow: inset 0 0px 16px #fffa;
  }
  h2 {
    line-height: 0.8;
    margin-bottom: 0.3em;
  }
</style>

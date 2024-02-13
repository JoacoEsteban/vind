<script lang="ts">
  import { makeDisplayUrl } from '~lib/url'

  export let url: string
  $: displayUrl = makeDisplayUrl(url)

  $: parts = (displayUrl && displayUrl.split('/')) || []
  $: protocol = (url && new URL(url).protocol) || ''
  const greySpan = (text: string) =>
    `<span class="text-neutral-content opacity-25">${text}</span>`
</script>

<div class="flex space-x-2">
  {@html greySpan(`${protocol}//`)}
  {#each parts as part, i}
    <span class="text-white">{part}</span>
    {@html greySpan('/')}
  {/each}
</div>

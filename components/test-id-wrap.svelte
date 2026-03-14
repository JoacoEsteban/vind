<script lang="ts">
  import type { TestId } from '~lib/test-id'
  import type { Renderable } from '~lib/svelte'

  export let SlotComponent: Renderable
  export let testId: TestId
</script>

{#if SlotComponent}
  <div class="contents" data-testid={testId.id}>
    {#if typeof SlotComponent === 'string'}
      {SlotComponent}
    {:else}
      <svelte:component this={SlotComponent} />
    {/if}
  </div>
{/if}

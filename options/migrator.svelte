<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Button from '~components/button.svelte'
  import Symbol from '~components/symbol.svelte'
  import type { ResourceMigrator } from '~lib/resource-migrator'
  import Heading from './heading.svelte'

  export let migrator: ResourceMigrator
  const dispatch = createEventDispatcher<{
    error: Error
    importSuccess: void
    exportSuccess: void
  }>()

  async function dump() {
    return migrator.exportAllResources().catch((error) => {
      dispatch('error', error)
      return ''
    })
  }

  const fromClipboard = wrapTransaction(async function () {
    const text = await navigator.clipboard.readText()
    await migrator.importResources(text)
    dispatch('importSuccess')
  })

  const toClipboard = wrapTransaction(async function () {
    await navigator.clipboard.writeText(await dump())
    dispatch('exportSuccess')
  })

  function wrapTransaction(fn: () => Promise<void>) {
    return async () => {
      fn().catch((error) => {
        dispatch('error', error)
      })
    }
  }
</script>

<template>
  <Heading title="Import" symbol="squareAndArrowDown" />
  <div class="flex gap-3">
    <Button icon="listClipboardFill" opaque on:click={fromClipboard}
      >Import from clipboard</Button>
  </div>

  <Heading title="Export" symbol="squareAndArrowUp" />
  <div class="flex gap-3">
    <Button icon="listClipboardFill" opaque on:click={toClipboard}
      >Export to clipboard</Button>
  </div>
</template>

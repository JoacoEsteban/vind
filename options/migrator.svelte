<script lang="ts">
  import toast from 'svelte-french-toast/dist'
  import { match } from 'ts-pattern'
  import Button from '~components/button.svelte'
  import { wrapResultAsync } from '~lib/control-flow'
  import { VindError } from '~lib/error'
  import type { ResourceMigrator } from '~lib/resource-migrator'
  import Heading from './heading.svelte'

  export let migrator: ResourceMigrator

  async function fromClipboard() {
    let { err, val: text } = await wrapResultAsync(() =>
      navigator.clipboard.readText(),
    )

    if (err) {
      toast.error('Uh oh, there was an error reading from clipboard')
      return
    }

    const result = await migrator.importResources(text as string)
    if (result.err) {
      toast.error(
        match(result.val)
          .when(
            (e) => e instanceof VindError,
            (e) => e.message,
          )
          .otherwise(() => 'Uh oh, there was an error importing'),
      )
      return
    }

    toast.success('Imported successfully')
  }

  async function toClipboard() {
    const result = await migrator.exportAllResources()

    if (result.err) {
      toast.error('Uh oh, there was an error exporting')
      return
    }

    const text = result.val

    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() =>
        toast.error('Uh oh, there was an error copying to clipboard'),
      )
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

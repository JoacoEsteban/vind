<script lang="ts">
  import { pEvent } from 'p-event'
  import toast from 'svelte-french-toast/dist'
  import { match } from 'ts-pattern'
  import { Err, None, Ok, type Result } from 'ts-results'
  import Button from '~components/button.svelte'
  import { wrapResultAsync } from '~lib/control-flow'
  import { VindError } from '~lib/error'
  import { exportedResourceFilename } from '~lib/misc'
  import type { ResourceMigrator } from '~lib/resource-migrator'
  import Heading from './heading.svelte'

  export let migrator: ResourceMigrator

  async function doImport(text: string): Promise<Result<None, Error>> {
    // TODO implement import result
    const result = await migrator.importResources(text)
    if (result.err) {
      toast.error(
        match(result.val)
          .when(
            (e) => e instanceof VindError,
            (e) => e.message,
          )
          .otherwise(() => 'Uh oh, there was an error importing'),
      )
      return Err(result.val)
    }

    toast.success('Imported successfully')
    return Ok(None)
  }

  async function doExport(): Promise<Result<string, Error>> {
    const result = await migrator.exportAllResources()

    if (result.err) {
      toast.error('Uh oh, there was an error exporting')
      return Err(result.val)
    }

    return Ok(result.val)
  }

  async function fromClipboard() {
    let result = await wrapResultAsync(() => navigator.clipboard.readText())

    if (result.err) {
      toast.error('Uh oh, there was an error reading from clipboard')
      return
    }

    return doImport(result.val)
  }

  async function fromFile() {
    const input = document.createElement<'input'>('input')
    input.type = 'file'
    input.accept = '.json'
    input.style.display = 'none'
    document.body.appendChild(input)

    const change = pEvent(input, 'change')
    input.click()
    await change

    const file = input.files?.[0]

    if (!file) {
      return None
    }

    const text = await file.text()

    return doImport(text)
  }

  async function toClipboard() {
    const result = await doExport()

    if (result.err) {
      return
    }

    navigator.clipboard
      .writeText(result.val)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() =>
        toast.error('Uh oh, there was an error copying to clipboard'),
      )
  }

  async function toFile() {
    const result = await doExport()

    if (result.err) {
      return
    }

    const blob = new Blob([result.val], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement<'a'>('a')
    a.href = url
    a.download = `${exportedResourceFilename()}.json`
    a.click()

    URL.revokeObjectURL(url)
    a.remove()

    toast.success('Exported successfully')
  }
</script>

<template>
  <Heading title="Import" symbol="squareAndArrowDown" />
  <div class="flex gap-3">
    <Button icon="listClipboardFill" opaque on:click={fromClipboard}
      >Import from clipboard</Button>
    <Button icon="arrowUpDocFill" opaque on:click={fromFile}
      >Import from File</Button>
  </div>

  <Heading title="Export" symbol="squareAndArrowUp" />
  <div class="flex gap-3">
    <Button icon="listClipboardFill" opaque on:click={toClipboard}
      >Copy to clipboard</Button>
    <Button icon="arrowDownDocFill" opaque on:click={toFile}
      >Export to File</Button>
  </div>
</template>

<script lang="ts">
  import { pEvent } from 'p-event'
  import toast from 'svelte-french-toast/dist'
  import { match } from 'ts-pattern'
  import { Err, None, Ok, type Result } from 'ts-results'
  import Button from '~components/button.svelte'
  import { sleep, wrapResultAsync } from '~lib/control-flow'
  import { colorSeeds } from '~lib/definitions'
  import { prompt, PromptType } from '~lib/dialog'
  import { VindError } from '~lib/error'
  import { log } from '~lib/log'
  import { exportedResourceFilename } from '~lib/misc'
  import type { ResourceMigrator } from '~lib/resource-migrator'
  import { withToast } from '~lib/toast'
  import Heading from './heading.svelte'

  export let migrator: ResourceMigrator

  async function doImport(text: string): Promise<Result<None, Error>> {
    const loadingToast = toast.loading('Importing')

    // TODO implement import result
    const result = await migrator.importResources(text)

    await sleep(200)
    toast.dismiss(loadingToast)

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
      log.error('Error exporting', result.val)
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
    const cancel = pEvent(input, 'cancel')

    input.click()

    await Promise.race([change, cancel])

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

  async function wipe() {
    const result = await prompt({
      type: PromptType.Boolean,
      title: 'Are you sure you want to delete all bindings?',
      subtitle: 'This cannot be undone',
    }).promise

    if (result) {
      const result = await migrator.wipeResources()
      if (result.err) {
        toast.error('Uh oh, there was an error')
        return
      }

      toast.success('Successfully deleted all bindings')
    }
  }
</script>

<template>
  <main>
    <h2>Migrator</h2>
    <p>
      If you want to share/backup your Bindings you can use the buttons below to
      import and export.
    </p>
    <p>
      You can import from the clipboard or a file, and export to the clipboard
      or a file.
    </p>
  </main>
  <Heading title="From Clipboard" symbol="listClipboardFill" />
  <div class="flex gap-3 flex-wrap">
    <Button icon="listClipboardFill" opaque on:click={toClipboard}
      >Copy to clipboard</Button>
    <Button icon="listClipboardFill" opaque on:click={fromClipboard}
      >Read from clipboard</Button>
  </div>

  <Heading title="From File" symbol="arrowUpDocFill" />
  <div class="flex gap-3 flex-wrap">
    <Button icon="arrowDownDocFill" opaque on:click={toFile}
      >Save to File</Button>
    <Button
      icon="arrowUpDocFill"
      opaque
      on:click={() => withToast('Waiting for file', fromFile)}
      >Load from File</Button>
  </div>

  <Heading classes="!text-red-500" title="Danger Zone" symbol="trashFill" />
  <div class="flex gap-3 flex-wrap">
    <Button
      colorSeed={colorSeeds.redCancel}
      icon="trashFill"
      opaque
      on:click={wipe}>Delete all bindings</Button>
  </div>
</template>

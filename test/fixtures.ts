import {
  test as base,
  chromium,
  type BrowserContext,
  type Worker,
} from '@playwright/test'
import path from 'path'
import { match } from 'ts-pattern'
import { openOverlay } from './lib/actions'

const extensionPath = match(process.env.NODE_ENV)
  .with('development', () => 'build/chrome-mv3-dev')
  .otherwise(() => 'build/chrome-mv3')

// The dev service worker is reachable before Chrome binds the extension APIs to it.
const waitForExtensionApis = async (background: Worker): Promise<void> =>
  match(await background.evaluate(() => typeof chrome.action))
    .with('object', () => undefined)
    .otherwise(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return waitForExtensionApis(background)
    })

export const test = base.extend<{
  context: BrowserContext
  extensionContext: {
    extensionId: string
    background: Worker
    openOverlay: () => Promise<void>
  }
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(process.cwd(), extensionPath)
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionContext: async ({ context }, use) => {
    const [background = await context.waitForEvent('serviceworker')] =
      context.serviceWorkers()

    await waitForExtensionApis(background)

    await use({
      extensionId: background.url().split('/')[2],
      background,
      openOverlay: () => background.evaluate(openOverlay),
    })
  },
})
export const expect = test.expect

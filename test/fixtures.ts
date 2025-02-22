import {
  test as base,
  chromium,
  type BrowserContext,
  type Worker,
} from '@playwright/test'
import path from 'path'
import { openOverlay } from './lib/actions'

const extensionPath = (
  {
    development: 'build/chrome-mv3-dev',
    production: 'build/chrome-mv3-prod',
  } as Record<typeof process.env.NODE_ENV, string>
)[process.env.NODE_ENV ?? 'production']

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

    await use({
      extensionId: background.url().split('/')[2],
      background,
      openOverlay: () => background.evaluate(openOverlay),
    })
  },
})
export const expect = test.expect

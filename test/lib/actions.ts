import type { Page } from '@playwright/test'
import { OpenOptionsButtonId } from '~lib/test-id'
import type { BrowserClickedEvent } from '~test/types'

export async function openOverlay() {
  ;(chrome.action.onClicked as unknown as BrowserClickedEvent).dispatch() // TODO make TS infer this type
}

export async function openOptions(page: Page) {
  const [optionsPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByTestId(OpenOptionsButtonId.id).click(),
  ])

  return optionsPage
}

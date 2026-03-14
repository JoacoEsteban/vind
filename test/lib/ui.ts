import type { Locator } from '@playwright/test'
import { expect } from '~test/fixtures'

export type ToggleValue = 'true' | 'false'

export async function setToggleValue(
  toggleLocator: Locator,
  from: ToggleValue,
  to: ToggleValue,
) {
  if (from === to) throw new Error(`Cannot set ${from} to itself.`)

  await expect(toggleLocator.locator('xpath=../..')).toHaveAttribute(
    'data-checked',
    from,
  )
  await toggleLocator.click()
  await expect(toggleLocator.locator('xpath=../..')).toHaveAttribute(
    'data-checked',
    to,
  )
}

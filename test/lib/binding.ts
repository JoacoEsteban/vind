import type { Locator, Page } from '@playwright/test'
import { expect } from '~test/fixtures'
import { BindButtonId, BindingButtonId } from '~lib/test-id'
import { nextFrameWaiter } from './utils'

export type TestBinding = Awaited<ReturnType<typeof createBinding>>

export async function createBinding({
  page,
  target,
  key,
}: {
  page: Page
  target: Locator
  key: string
}) {
  const nextFrame = nextFrameWaiter(page)
  const bindButton = page.getByTestId(BindButtonId.id)
  await expect(bindButton).toBeEnabled()
  await bindButton.click()

  const bounds = await target.boundingBox()
  expect(bounds).toBeDefined()

  let { x, y, width, height } = bounds!

  await page.mouse.move(x - 1, y - 1).then(nextFrame) // move mouse just outside of target

  x += width / 2 // center on button
  y += height / 2 // center on button

  await page.mouse.move(x, y).then(nextFrame) // move mouse into target to trigger mouseenter event so that vind sets the vind-overlay
  await page.mouse.click(x, y).then(nextFrame)
  await page.keyboard.type(key)

  const bindingButton = page.getByTestId(BindingButtonId(key).id)

  const assertIsEnabled = () => expect(bindingButton).toBeEnabled()

  await assertIsEnabled()

  return {
    bindingButton,
    trigger: () => assertIsEnabled().then(() => page.keyboard.type(key)),
    target,
    key,
  }
}

export async function expectBindingTriggerToSucceed(
  binding: TestBinding,
  outcome: () => Promise<void>,
  options?: {
    timeout?: number
    intervals?: number[]
  },
) {
  return binding.trigger().then(() =>
    expect(async () =>
      outcome().catch((e) =>
        // Retry by triggering binding again and throwing the error to hint toPass
        binding.trigger().then(() => {
          throw e
        }),
      ),
    ).toPass(options),
  )
}

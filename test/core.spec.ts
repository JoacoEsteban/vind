import { test, expect } from './fixtures'
import { expectBindingTriggerToSucceed, createBinding } from './lib/binding'

test('create and trigger binding', async ({
  page,
  extensionContext: { openOverlay },
}) => {
  await page.goto('https://google.com')
  page.bringToFront()

  const speechDialog = page.locator('#spch-dlg').first()

  expect(speechDialog).toBeAttached()
  expect(speechDialog).not.toHaveAttribute('open')

  await openOverlay()

  const binding = await createBinding({
    page,
    key: 'v',
    target: page.locator('[jsname="F7uqIe"]').first(),
  })

  await expectBindingTriggerToSucceed(binding, () =>
    expect(speechDialog).toHaveAttribute('open', {
      timeout: 100,
    }),
  )
})

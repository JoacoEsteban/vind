import { BindButtonId, TestId } from '~lib/test-id'
import { test, expect } from './fixtures'
import { expectBindingTriggerToSucceed, createBinding } from './lib/binding'
import { LocatorTextContentChangeValidator } from './lib/cases'

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

test('getting-started page behavior', async ({
  page,
  extensionContext: { openOverlay, extensionId },
}) => {
  await page.goto(`chrome-extension://${extensionId}/tabs/getting-started.html`)
  page.bringToFront()

  const popupButtonTestId = new TestId('getting-started:open-popup-button')
  const colorButtonTestId = new TestId('getting-started:color-button')
  const colorLabelTester = await new LocatorTextContentChangeValidator(
    page,
    new TestId('getting-started:color-label'),
    (color) => expect(color).toMatch(/^\#[\d\w]{6}$/),
  ).init()

  await page.getByTestId(popupButtonTestId.id).click()
  await expect(page.getByTestId(BindButtonId.id)).toBeEnabled()

  const binding = await createBinding({
    page,
    key: 'c',
    target: page.getByTestId(colorButtonTestId.id).first(),
  })

  await expectBindingTriggerToSucceed(binding, () =>
    colorLabelTester.expectChange(),
  )
})

test('options page opens', async ({
  page,
  extensionContext: { extensionId },
}) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`)
  await expect(page.locator('body')).toContainText('Vind Options')
})

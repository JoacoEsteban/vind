import {
  RegistrationNotificationToastId,
  TestId,
  bindingActivatedNotificationId,
  OptionsTabsId,
  NotificationToggleButtonId,
} from '~lib/test-id'
import { test, expect } from './fixtures'
import { expectBindingTriggerToSucceed, createBinding } from './lib/binding'
import { html, loadStaticHTML } from './lib/utils'
import { writeConditionOnAddedElement } from './lib/page-eval'
import { openOptions } from './lib/actions'
import { setToggleValue } from './lib/ui'

test('binding trigger notification fires', async ({
  page,
  extensionContext: { openOverlay },
}) => {
  const assertionId = new TestId('Binding Triggered')
  await loadStaticHTML(
    page,
    html`
      <body>
        <button onclick="this.innerText = '${assertionId.id}'">
          Should bind
        </button>
      </body>
    `,
  )

  await page.bringToFront()
  await openOverlay()

  const { assert: assertBindingNotificationAppeared } =
    await writeConditionOnAddedElement(page, bindingActivatedNotificationId)

  const button = page.locator('button').first()
  await expect(button).toHaveText('Should bind')

  const binding = await createBinding({
    page,
    key: 'v',
    target: page.locator('button').first(),
  })

  // await expect(async () => {
  const toast = page.getByTestId(
    new RegistrationNotificationToastId('success').id,
  )
  await expect(toast).toHaveText('Binding registered')
  await expect(toast).toBeAttached()
  await expect(toast).not.toBeAttached()

  await expectBindingTriggerToSucceed(binding, async () => {
    await expect(button).toHaveText(assertionId.id)
  })

  const notification = page.getByTestId(bindingActivatedNotificationId.id)
  await expect(notification).toHaveCount(1)
  await expect(notification).toBeVisible()
  await expect(notification).toHaveText('Binding activated')
  await assertBindingNotificationAppeared(true)
})

test('binding trigger notification does not fire with setting', async ({
  page,
  extensionContext: { openOverlay },
}) => {
  const assertionId = new TestId('Binding Triggered')
  await loadStaticHTML(
    page,
    html`
      <body>
        <button onclick="this.innerText = '${assertionId.id}'">
          Should bind
        </button>
      </body>
    `,
  )

  const { assert: assertBindingNotificationAppeared } =
    await writeConditionOnAddedElement(page, bindingActivatedNotificationId)

  await page.bringToFront()
  await openOverlay()

  async function disableBindingActivatedNotification() {
    const optionsPage = await openOptions(page)
    await optionsPage.waitForLoadState()
    await optionsPage.bringToFront()

    await optionsPage.getByTestId(new OptionsTabsId('notifications').id).click()
    const bindingActivatedNotificationToggle = optionsPage.getByTestId(
      new NotificationToggleButtonId('bindingActivated').id,
    )
    await setToggleValue(bindingActivatedNotificationToggle, 'true', 'false')
    await optionsPage.close()
  }

  await disableBindingActivatedNotification()

  const button = page.locator('button').first()
  await expect(button).toHaveText('Should bind')

  const binding = await createBinding({
    page,
    key: 'v',
    target: page.locator('button').first(),
  })

  const toast = page.getByTestId(
    new RegistrationNotificationToastId('success').id,
  )
  await expect(toast).toHaveText('Binding registered')
  await expect(toast).toBeAttached()
  await expect(toast).not.toBeAttached()

  await expectBindingTriggerToSucceed(binding, async () => {
    await expect(button).toHaveText(assertionId.id)
  })

  await assertBindingNotificationAppeared(false)
})

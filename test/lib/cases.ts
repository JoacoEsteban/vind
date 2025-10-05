import type { Locator, Page } from '@playwright/test'
import type { TestId } from '~lib/test-id'
import { expect } from '~test/fixtures'

export class LocatorTextContentChangeValidator {
  private state: {
    text: string
    locator: Locator
  } | null = null

  constructor(
    readonly page: Page,
    readonly targetTestId: TestId,
    private readonly validator?: (newValue: string) => Promise<void> | void,
  ) {}

  async init() {
    if (this.state) {
      throw new Error('Already initialized')
    }

    const locator = this.page.getByTestId(this.targetTestId.id)
    await expect(locator).toBeVisible()
    const currentText = await this.getAssertedText(locator)

    this.state = {
      text: currentText,
      locator: locator,
    }

    return this
  }

  async getAssertedText(locator = this.state?.locator) {
    if (!locator) {
      throw new Error('Locator not provided')
    }

    const text = await locator.textContent()
    if (text === null) {
      throw new Error('Text content is null')
    }

    await this.validator?.(text)

    return text
  }

  async expectChange() {
    if (!this.state) {
      throw new Error('Not initialized')
    }

    const nexText = await this.getAssertedText()
    if (nexText === this.state.text) {
      throw new Error('Text did not change')
    }

    this.state.text = nexText
  }
}

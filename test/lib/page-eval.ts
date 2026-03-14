import type { Page } from '@playwright/test'
import type { TestId } from '~lib/test-id'
import { expect } from '~test/fixtures'

export async function writeConditionOnAddedElement(page: Page, testId: TestId) {
  await page.evaluate((testId) => {
    type Root = Document | ShadowRoot

    // augment global for the flag
    ;(
      window as typeof window & { __elementAppeared: boolean }
    ).__elementAppeared = false

    const check = (root: Root): void => {
      const found = root.querySelector(
        `[data-testid="${testId}"]`,
      ) as Element | null

      if (found) {
        ;(
          window as typeof window & { __elementAppeared: boolean }
        ).__elementAppeared = true
      }
    }

    const observeRoot = (root: Root): void => {
      check(root)

      const observer = new MutationObserver((mutations: MutationRecord[]) => {
        check(root)

        for (const m of mutations) {
          m.addedNodes.forEach((node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element & { shadowRoot?: ShadowRoot | null }

              if (el.shadowRoot) {
                observeRoot(el.shadowRoot)
              }
            }
          })
        }
      })

      observer.observe(root, { childList: true, subtree: true })

      root.querySelectorAll('*').forEach((el) => {
        const host = el as Element & { shadowRoot?: ShadowRoot | null }
        if (host.shadowRoot) {
          observeRoot(host.shadowRoot)
        }
      })
    }

    observeRoot(document)
  }, testId.id)

  const extractCondition = async () =>
    page.evaluate(
      () =>
        (window as typeof window & { __elementAppeared: boolean })
          .__elementAppeared,
    )

  return {
    extractCondition,
    assert: async (value: boolean) =>
      expect(await extractCondition()).toBe(value),
  }
}

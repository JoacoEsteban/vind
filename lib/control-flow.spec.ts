import { expect, test } from '@playwright/test'
import { wrapResult, wrapResultAsync } from './control-flow'

test('wrapResult should not throw', () => {
  expect(async () => {
    wrapResult(() => {
      throw new Error('SHOULD NOT THROW')
    })
    await wrapResultAsync(() =>
      Promise.reject(new Error('SHOULD NOT THROW IN PROMISE')),
    )
  }).not.toThrow()
})

import { expect, test } from '@playwright/test'
import { getOverlayBuildLabel, getPopupTitle } from './build-label'

test.describe('build label visibility', () => {
  test('hides build label in production', () => {
    expect(getOverlayBuildLabel('abcd1234@ef567890', true)).toBeNull()
  })

  test('shows build label in development', () => {
    expect(getOverlayBuildLabel('abcd1234@ef567890', false)).toBe(
      'abcd1234@ef567890',
    )
  })
})

test.describe('popup title', () => {
  test('shows app name in production', () => {
    expect(getPopupTitle(null)).toBe('Vind')
  })

  test('shows only build label in development', () => {
    expect(getPopupTitle('abcd1234@ef567890')).toBe('abcd1234@ef567890')
  })
})

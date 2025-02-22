import type { Page } from '@playwright/test'

export const waitFrames = (page: Page, frames = 1) =>
  page.evaluate((frames) => {
    function loop(resolve: () => void, iterations = 0, frames = 1) {
      if (Math.min(iterations, frames) === frames) return resolve()
      requestAnimationFrame(() => loop(resolve, iterations + 1, frames))
    }

    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => loop(resolve, 0, frames)),
    )
  }, frames)

export const nextFrameWaiter = (page: Page, frames?: number) => () =>
  waitFrames(page, frames)

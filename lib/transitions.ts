import { circIn, circOut } from 'svelte/easing'
import { fade, scale, type TransitionConfig } from 'svelte/transition'

export type TransitionParams = Parameters<typeof useTransition>[0]

export function useTransition({
  easing = circOut,
  duration = 200,
  scaleStart = 0.8,
  animations = ['fade', 'scale'] as Array<'fade' | 'scale'>,
}) {
  return function (node: Element, { delay = 0 } = {}): TransitionConfig {
    const anims: ((t: number, u: number) => string)[] = []
    if (animations.includes('fade'))
      anims.push(fade(node, { duration, easing }).css!)
    if (animations.includes('scale'))
      anims.push(scale(node, { start: scaleStart, duration, easing }).css!)

    return {
      delay,
      duration,
      easing,
      css: (t, u) => anims.map((a) => a(t, u)).join('; '),
    }
  }
}

export const useTransitionIn = (args: Omit<TransitionParams, 'easing'> = {}) =>
  useTransition(args)
export const useTransitionOut = (args: Omit<TransitionParams, 'easing'>) =>
  useTransition({
    ...args,
    easing: circIn,
  })

export const useTransitions = (args: Omit<TransitionParams, 'easing'>) => ({
  in: useTransition(args),
  out: useTransitionOut(args),
})

export const transitionIn = useTransitionIn()
export const transitionOut = useTransitionOut({
  duration: 100,
})

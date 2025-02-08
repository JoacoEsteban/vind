import { distinctUntilChanged, fromEvent, map, share, startWith } from 'rxjs'
import { log } from './log'

export const documentVisiblity$ = fromEvent(document, 'visibilitychange').pipe(
  map(() => document.hidden),
  startWith(document.hidden), // Add the initial value of document.hidden
  distinctUntilChanged(),
  share(),
)

const animationPlayState$ = documentVisiblity$.pipe(
  map((hidden) => (hidden ? 'paused' : '')), // do not use 'running' because it will override other selectors
  share(),
)

export function handleAnimationState(node: HTMLElement) {
  const sub = animationPlayState$.subscribe((state) => {
    log.info('animationPlayState', state)
    node.style.animationPlayState = state
  })

  return {
    destroy: () => {
      sub.unsubscribe()
    },
  }
}

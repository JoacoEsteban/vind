import { distinctUntilChanged, fromEvent, map, share } from 'rxjs'
import { log } from './log'

const documentVisiblity$ = fromEvent(document, 'visibilitychange')
  .pipe(
    map(() => document.hidden),
    distinctUntilChanged(),
    share()
  )

const animationPlayState$ = documentVisiblity$
  .pipe(
    map(hidden => hidden ? 'paused' : ''), // do not use 'running' because it will override other selectors
    share()
  )

export function handleAnimationState (node: HTMLElement) {
  const sub = animationPlayState$.subscribe(state => {
    log.info('animationPlayState', state)
    node.style.animationPlayState = state
  })

  return {
    destroy: () => {
      sub.unsubscribe()
    }
  }
}
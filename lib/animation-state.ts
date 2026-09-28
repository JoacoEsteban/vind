import {
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  share,
  startWith,
} from 'rxjs'
import { match } from 'ts-pattern'
import { log } from './log'

export const documentVisiblity$ = fromEvent(document, 'visibilitychange').pipe(
  map(() => document.hidden),
  startWith(document.hidden), // Add the initial value of document.hidden
  distinctUntilChanged(),
  share(),
)

const windowFocused$ = merge(
  fromEvent(window, 'focus').pipe(map(() => true)),
  fromEvent(window, 'blur').pipe(map(() => false)),
).pipe(startWith(document.hasFocus()), distinctUntilChanged())

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const prefersReducedMotion$ = fromEvent<MediaQueryListEvent>(
  reducedMotionQuery,
  'change',
).pipe(
  map((event) => event.matches),
  startWith(reducedMotionQuery.matches),
)

const animationPlayState$ = combineLatest([
  documentVisiblity$,
  windowFocused$,
  prefersReducedMotion$,
]).pipe(
  map((conditions) =>
    match(conditions)
      .with([false, true, false], () => 'running')
      .otherwise(() => 'paused'),
  ),
  distinctUntilChanged(),
  share(),
)

// Sets the inherited --animation-play-state; animated descendants opt in with
// `animation-play-state: var(--animation-play-state, running)`.
export function handleAnimationState(node: HTMLElement) {
  const sub = animationPlayState$.subscribe((state) => {
    log.info('animationPlayState', state)
    node.style.setProperty('--animation-play-state', state)
  })

  return {
    destroy: () => {
      sub.unsubscribe()
    },
  }
}

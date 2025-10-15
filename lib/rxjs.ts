import {
  BehaviorSubject,
  Subject,
  Observable,
  map,
  mergeMap,
  from,
  throttleTime,
  withLatestFrom,
  of,
  tap,
  type MonoTypeOperatorFunction,
  share,
  ReplaySubject,
  filter,
} from 'rxjs'
import { log } from './log'
import { noop, type Constructor } from './misc'

export function expose<T>(observable: Observable<T>): () => T | null
export function expose<T>(observable: Observable<T>, startWith: T): () => T
export function expose<T>(observable: Observable<T>, startWith?: T) {
  const subject = new BehaviorSubject<T | null>(startWith ?? null)
  observable.subscribe(subject)
  return subject.getValue.bind(subject)
}

export function exposeSubject<T>(subject: BehaviorSubject<T>) {
  return subject.getValue.bind(subject)
}

export function Stopper() {
  const stopper = new Subject<void>()
  return {
    stopper,
    stop: () => {
      stopper.next()
      stopper.complete()
    },
  }
}

export function PromiseStopper(promise: Promise<any>) {
  const { stopper, stop } = Stopper()
  promise.finally(stop)
  return {
    stopper,
    stop,
  }
}

export function Stack() {
  const stack$$ = new BehaviorSubject<number>(0)

  return {
    stack$$,
    empty$: stack$$.pipe(map((val) => !val)),
    full$: stack$$.pipe(map((val) => val > 0)),
    push: function () {
      stack$$.next(stack$$.value + 1)
    },
    pop: function () {
      stack$$.next(stack$$.value - 1)
    },
    reset: function () {
      stack$$.next(0)
    },
    complete: function () {
      stack$$.complete()
    },
  }
}

export class ToggleSubject extends BehaviorSubject<boolean> {
  constructor(initial: boolean = false) {
    super(initial)
  }

  toggle() {
    this.next(!this.value)
  }
}

export class VoidSubject extends Subject<void> {}

// pipeable operator
export function unwrapPromise<T>() {
  return (source: Observable<Promise<T>>): Observable<T> =>
    source.pipe(mergeMap((value) => from(value)))
}

export function svelteCompat<T = unknown>(
  subject: Subject<T>,
): Subject<T> & { set: Subject<T>['next'] } {
  return Object.assign(subject, {
    set: subject.next.bind(subject),
  })
}

export function throttleTimeLeadTrail<T>(ms: number) {
  return throttleTime<T>(ms, undefined, { leading: true, trailing: true })
}

export function withStatic<T, K>(staticValue: T) {
  return withLatestFrom<K, [T]>(of(staticValue))
}

export function asVoid() {
  return map(noop)
}

export function debug<T>(message?: string, logFn = log.debug) {
  return tap((value: T) => {
    logFn(message || 'Log:', value)
  })
}

export function makeDebug(logFn = log.debug) {
  return <T>(message: string) => debug<T>(message, logFn)
}

export const shareLatest = <T>(
  resetOnRefCountZero = true,
): MonoTypeOperatorFunction<T> =>
  share<T>({
    connector: () => new ReplaySubject<T>(1),
    resetOnError: true,
    resetOnComplete: true,
    resetOnRefCountZero,
  })

export function instanceOfFilter<T>(ctor: Constructor<T>) {
  return filter(function (target): target is T {
    return target instanceof ctor
  })
}

export function abortSignal$(signal: AbortSignal) {
  return new Observable<void>((subscriber) => {
    signal.addEventListener('abort', () => {
      subscriber.complete()
    })
  })
}

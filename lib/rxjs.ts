import {
  BehaviorSubject,
  Subject,
  type Observable,
  map,
  queue,
  type OperatorFunction,
  mergeMap,
  from,
  isObservable,
} from 'rxjs'

export function expose<T>(observable: Observable<T>) {
  const subject = new BehaviorSubject<T | null>(null)
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

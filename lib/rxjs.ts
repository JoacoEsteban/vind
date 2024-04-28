import { BehaviorSubject, Subject, type Observable } from 'rxjs'

export function expose<T> (observable: Observable<T>) {
  const subject = new BehaviorSubject<T | null>(null)
  observable.subscribe(subject)
  return subject.getValue.bind(subject)
}

export function exposeSubject<T> (subject: BehaviorSubject<T>) {
  return subject.getValue.bind(subject)
}

export function Stopper () {
  const stopper = new Subject<void>()
  return {
    stopper,
    stop: () => {
      stopper.next()
      stopper.complete()
    }
  }
}

export function PromiseStopper (promise: Promise<any>) {
  const { stopper, stop } = Stopper()
  promise.finally(stop)
  return {
    stopper,
    stop
  }
}
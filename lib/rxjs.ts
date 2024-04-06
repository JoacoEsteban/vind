import { BehaviorSubject, type Observable } from 'rxjs'

export function expose<T> (observable: Observable<T>) {
  const subject = new BehaviorSubject<T | null>(null)
  observable.subscribe(subject)
  return subject.getValue.bind(subject)
}
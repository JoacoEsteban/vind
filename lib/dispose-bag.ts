import { takeUntil } from 'rxjs'
import { VoidSubject } from './rxjs'

export class DisposeBag {
  private destroy$ = new VoidSubject()
  public dispose = this.doDispose.bind(this)
  public sink = this.doSink.bind(this)

  private doSink<T>() {
    return takeUntil<T>(this.destroy$)
  }

  private doDispose() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

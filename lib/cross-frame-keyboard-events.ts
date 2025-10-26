import {
  Observable,
  Subject,
  Subscription,
  filter,
  finalize,
  fromEvent,
  map,
  merge,
  share,
  take,
} from 'rxjs'
import { forwardKeyEvent, type KeyboardEventDto } from '~messages/tabs'
import { abortSignal$, instanceOfFilter } from './rxjs'
import { match } from 'ts-pattern'
import { P } from 'ts-pattern'
import { log } from './log'
import { isBindableKeyboardEvent } from './element'
import { DisposeBag } from './dispose-bag'
import type { _Event } from 'bun-types/globals'
import { TotalMap } from './map'

export enum SupportedKeyboardEvent {
  KeyUp = 'keyup',
  KeyDown = 'keydown',
  KeyPress = 'keypress',
}
const supportedEvents = [
  SupportedKeyboardEvent.KeyUp,
  SupportedKeyboardEvent.KeyDown,
  SupportedKeyboardEvent.KeyPress,
] as const

export class VindKeyboardEvent extends KeyboardEvent {
  readonly rawEvent: KeyboardEvent | null
  readonly serialized: KeyboardEventDto
  get isBindable() {
    return this.serialized.isBindable
  }

  constructor(serialized: KeyboardEventDto)
  constructor(event: KeyboardEvent)
  constructor(event: KeyboardEventDto | KeyboardEvent) {
    const type = event.type as SupportedKeyboardEvent

    if (!supportedEvents.includes(type)) {
      throw new Error(
        `Got unsupported event type: '${type}' when creating VindKeyboardEvent`,
      )
    }

    const { toDto } = CrossFrameKeyboardEventChannel

    const { serialized, rawEvent } = match(event)
      .with(P.instanceOf(KeyboardEvent), (rawEvent) => ({
        serialized: toDto(rawEvent),
        rawEvent,
      }))
      .otherwise((serialized) => ({
        serialized,
        rawEvent: null,
      }))

    super(event.type, {
      ...serialized,
      bubbles: false,
      cancelable: false,
      composed: true,
    })

    this.serialized = serialized
    this.rawEvent = rawEvent ?? null
  }
}

class CrossFrameKeyboardEventChannel {
  protected readonly events$ = merge(
    ...supportedEvents.map((event) =>
      fromEvent(document, event, {
        capture: true,
      }).pipe(
        instanceOfFilter(KeyboardEvent),
        map((event) => new VindKeyboardEvent(event)),
      ),
    ),
  )
  private channel = new Subject<VindKeyboardEvent>()
  readonly channel$ = this.channel.asObservable()

  constructor(public readonly isIframe: boolean) {
    match(isIframe)
      .with(true, () => this.forwardEvents())
      .otherwise(() => this.listenEvents())
  }

  private forwardEvents() {
    this.events$.subscribe((event) => {
      forwardKeyEvent.ask(event.serialized)
    })
  }

  private listenEvents() {
    merge(
      this.events$,
      forwardKeyEvent.stream.pipe(
        map(([event]) => new VindKeyboardEvent(event)),
      ),
    ).subscribe(this.channel)
  }

  static toDto(event: KeyboardEvent): KeyboardEventDto {
    return {
      type: event.type,
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      isBindable: isBindableKeyboardEvent(event),
    }
  }
}

interface VindEventListener {
  (ev: KeyboardEvent): void
}
interface VindEventListenerObject extends VindEventListener {
  handleEvent(ev: KeyboardEvent): void
}
type VindListener = VindEventListener // | VindEventListenerObject

export class CrossFrameEventsController extends CrossFrameKeyboardEventChannel {
  private listeners = new TotalMap<
    SupportedKeyboardEvent,
    Map<VindListener, Subscription>
  >({
    [SupportedKeyboardEvent.KeyDown]: new Map(),
    [SupportedKeyboardEvent.KeyUp]: new Map(),
    [SupportedKeyboardEvent.KeyPress]: new Map(),
  })

  private eventSubjects = this.listeners.map(
    () => new Subject<VindKeyboardEvent>(),
  )
  readonly eventStreams = this.eventSubjects.map((_, sub) => sub.asObservable())

  constructor(
    ...args: ConstructorParameters<typeof CrossFrameKeyboardEventChannel>
  ) {
    super(...args)

    this.channel$
      .pipe(
        finalize(() => {
          this.eventSubjects.forEach((stream) => stream.complete())
        }),
      )
      .subscribe((ev) => {
        this.eventSubjects
          .get(ev.serialized.type as SupportedKeyboardEvent)
          ?.next(ev)
      })
  }

  addEventListener(
    event: SupportedKeyboardEvent,
    listener: VindListener,
    options?: AddEventListenerOptions,
  ) {
    if ((event as string) === 'error') {
      // from pEvent
      return
    }

    const listeners = this.listeners.get(event)
    if (!listeners) {
      throw new Error(`Invalid event type: ${event}`)
    }

    const stream$ = this.eventStreams.get(event)
    if (!stream$) {
      throw new Error(`Invalid event type: ${event}`)
    }

    const previousSubscription = listeners.get(listener)
    if (previousSubscription) {
      log.warn(`Listener already exists: ${listener}`)
      return
    }

    const { once, signal } = options ?? {}
    const { sink, dispose } = new DisposeBag()

    const obs = match(once)
      .with(true, () => stream$.pipe(take(1)))
      .otherwise(() => stream$)
      .pipe(sink())

    const subscription = obs.subscribe(listener)

    if (signal) {
      abortSignal$(signal)
        .pipe(sink())
        .subscribe(() => {
          this.removeEventListener(event, listener)
        })
    }

    listeners.set(listener, subscription)
    subscription.add(() => {
      dispose()
      listeners.delete(listener)
    })
  }

  removeEventListener(event: SupportedKeyboardEvent, listener: VindListener) {
    if ((event as string) === 'error') {
      // from pEvent
      return
    }

    const listeners = this.listeners.get(event)
    if (!listeners) {
      throw new Error(`Invalid event type: ${event}`)
    }

    const subscription = listeners.get(listener)
    if (!subscription) {
      log.warn(`Listener not found: ${listener}`)
      return
    }

    subscription.unsubscribe()
  }
}

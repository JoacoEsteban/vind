import {
  Observable,
  filter,
  finalize,
  fromEvent,
  map,
  merge,
  of,
  race,
  switchMap,
  take,
  tap,
  timeout,
} from 'rxjs'
import { asVoid, instanceOfFilter, throttleTimeLeadTrail } from './rxjs'
import { DisposeBag } from './dispose-bag'
import { onElementDisconnected } from './element'
import { clearCanvas, drawPolygon } from './polygon-draw'
import { projectingTriangle } from './triangle-projection'
import { match } from 'ts-pattern'

type Point = [number, number]
type Triangle = [Point, Point, Point]

export enum PolygonState {
  LandedFrom,
  LandedTo,
  Exit,
  Idle,
}

export function handleExitPolygon(
  from: HTMLElement,
  to: HTMLElement,
): Observable<PolygonState> {
  const { sink, dispose } = new DisposeBag()

  const disconnectHandlers = [onElementDisconnected(from)]
  merge(...disconnectHandlers.map(({ onDisconnected$ }) => onDisconnected$))
    .pipe(
      take(1),
      tap(dispose),
      finalize(() => disconnectHandlers.forEach(({ cancel }) => cancel())),
      sink(),
    )
    .subscribe()

  return fromEvent(from, 'mouseleave').pipe(
    instanceOfFilter(MouseEvent),
    sink(),
    switchMap((ev) =>
      race([
        exitsPolygon$(ev, to).pipe(map(() => PolygonState.Exit)),
        fromEvent(to, 'mouseenter').pipe(map(() => PolygonState.LandedTo)),
        fromEvent(from, 'mouseenter').pipe(map(() => PolygonState.LandedFrom)),
      ]),
    ),
  )
}

function exitsPolygon$(
  leaveEvent: MouseEvent,
  to: HTMLElement,
): Observable<void> {
  const { clientX, clientY } = leaveEvent

  return fromEvent(document, 'mousemove').pipe(
    throttleTimeLeadTrail(40),
    instanceOfFilter(MouseEvent),
    map((moveEvent) => {
      const bounds = to.getBoundingClientRect()
      const triangle = projectingTriangle(bounds, [clientX, clientY])

      return match(triangle)
        .with(null, () => false)
        .otherwise((triangle) => {
          // drawPolygon(triangle)
          const point = [moveEvent.clientX, moveEvent.clientY] as Point
          return isPointInTriangle(point, triangle)
        })
    }),
    timeout({
      each: 100,
      with: () => of(false),
    }),
    filter((inside) => !inside),
    // tap(clearCanvas),
    asVoid(),
  )
}

function isPointInTriangle(p: Point, [a, b, c]: Triangle): boolean {
  const [px, py] = p
  const [x1, y1] = a
  const [x2, y2] = b
  const [x3, y3] = c

  const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
  const alpha = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator
  const beta = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator
  const gamma = 1 - alpha - beta

  return (
    alpha >= 0 &&
    beta >= 0 &&
    gamma >= 0 &&
    alpha <= 1 &&
    beta <= 1 &&
    gamma <= 1
  )
}

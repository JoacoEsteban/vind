import { match } from 'ts-pattern'
import { StylePropertyAndParentsObserver } from '~lib/element'
import { EMPTY, Observable, fromEvent, map, merge, switchMap, tap } from 'rxjs'
import { expose, instanceOfFilter } from './rxjs'
import { DisposeBag } from './dispose-bag'
import { call } from './misc'

function bounds(dragItem: HTMLElement) {
  return dragItem.getBoundingClientRect()
}

function getComputedZoom(item: HTMLElement): number {
  const zoom = parseFloat(getComputedStyle(item).getPropertyValue('zoom') ?? 0)
  const { parentElement } = item
  if (!parentElement) return zoom
  return zoom * getComputedZoom(parentElement)
}

const [centerX, centerY] = [
  (bounds: DOMRect) => (window.innerWidth - bounds.width) / 2,
  (bounds: DOMRect) => (window.innerHeight - bounds.height) / 2,
]

export function draggable(
  node: HTMLElement,
  [initialPosition = { x: 0, y: 0 }, enabled$]: [
    initialPosition: {
      x: number | 'center'
      y: number | 'center'
    },
    enabled$: Observable<boolean>,
  ],
) {
  const friction = 0.85
  const dragItem = node
  const getBounds = () => bounds(dragItem)
  const itemBounds = getBounds()
  const zoom$ = new StylePropertyAndParentsObserver(dragItem, 'zoom').pipe(
    map(() => getComputedZoom(dragItem)),
  )
  const zoom = expose(zoom$, getComputedZoom(dragItem))

  let active = false
  let currentX: number = 0
  let currentY: number = 0
  let initialX: number
  let initialY: number
  let [xOffset, yOffset] = [
    {
      value: initialPosition.x,
      center: centerX.bind(null, itemBounds),
    },
    {
      value: initialPosition.y,
      center: centerY.bind(null, itemBounds),
    },
  ].map(({ value, center }) =>
    match(value)
      .with('center', center)
      .otherwise((value) => value),
  )

  let lastX: number
  let lastY: number
  let velocityX = 0
  let velocityY = 0
  let rafID: number

  function dragStart(e: PointerEvent) {
    initialX = e.clientX - xOffset
    initialY = e.clientY - yOffset
    lastX = e.clientX
    lastY = e.clientY
    if (isTarget(e.target as HTMLElement)) {
      active = true
      dragItem.setPointerCapture(e.pointerId)
    }
    cancelAnimationFrame(rafID) // Stop any ongoing animation
  }

  function isTarget(target: HTMLElement) {
    switch (target.nodeName) {
      case 'BUTTON':
      case 'INPUT':
      case 'TEXTAREA':
        return false
    }

    if (target === dragItem) return true
    if (target.parentElement) {
      return isTarget(target.parentElement)
    }
    return false
  }

  function dragEnd(e: PointerEvent) {
    initialX = currentX
    initialY = currentY
    active = false
    animate() // Start animating with the final velocity
    dragItem.releasePointerCapture(e.pointerId)
  }

  function setOffset(x = xOffset, y = yOffset) {
    const { width, height } = getBounds()
    xOffset = Math.min(Math.max(x, 0), window.innerWidth - width)
    yOffset = Math.min(Math.max(y, 0), window.innerHeight - height)
  }

  function drag(e: PointerEvent) {
    if (!active) return
    e.preventDefault()
    currentX = e.clientX - initialX
    currentY = e.clientY - initialY

    // Calculate velocity
    velocityX = e.clientX - lastX
    velocityY = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY

    setOffset(currentX, currentY)

    setTranslate()
  }

  function setTranslate() {
    const z = zoom() ?? 1
    dragItem.style.transform = `translate3d(${xOffset / z}px, ${
      yOffset / z
    }px, 0)`
  }

  function adjust() {
    setOffset()
    setTranslate()
  }

  function animate() {
    if (!active && (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1)) {
      // Apply friction
      velocityX *= friction
      velocityY *= friction

      setOffset(xOffset + velocityX, yOffset + velocityY)
      setTranslate()

      rafID = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(rafID)
    }
  }

  const parent = (() => {
    let p = node.parentElement
    while (p && getComputedStyle(p).position !== 'relative') {
      p = p.parentElement
    }
    return p
  })()

  if (!parent) {
    throw new Error('No relative parent found')
  }

  const { sink, dispose } = new DisposeBag()

  const listeners = [
    ['pointerdown', dragStart],
    ['pointerup', dragEnd],
    ['pointermove', drag],
  ] as const

  const handlers = listeners.map(
    ([eventType, handler]) =>
      () =>
        fromEvent(parent, eventType, { capture: false }).pipe(
          instanceOfFilter(PointerEvent),
          tap(handler),
        ),
  )
  const buildHandlers = () => merge(...handlers.map(call))

  enabled$
    .pipe(
      switchMap((enabled) =>
        match(enabled)
          .with(true, buildHandlers)
          .otherwise(() => EMPTY),
      ),
      sink(),
    )
    .subscribe()

  enabled$
    .pipe(
      map((val) => (val ? 'move' : '')),
      sink(),
    )
    .subscribe((cursor) => (dragItem.style.cursor = cursor))

  merge(zoom$, fromEvent(window, 'resize')).pipe(sink()).subscribe(adjust)

  setTimeout(adjust)

  return {
    destroy: dispose,
  }
}

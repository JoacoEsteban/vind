import { match } from 'ts-pattern'

const [centerX, centerY] = [
  (dragItem: HTMLElement) => (window.innerWidth - dragItem.clientWidth) / 2,
  (dragItem: HTMLElement) => (window.innerHeight - dragItem.clientHeight) / 2,
]

export function draggable(
  node: HTMLElement,
  initialPosition: {
    x: number | 'center'
    y: number | 'center'
  } = { x: 0, y: 0 },
) {
  const friction = 0.85
  const dragItem = node

  let active = false
  let currentX: number = 0
  let currentY: number = 0
  let initialX: number
  let initialY: number
  let [xOffset, yOffset] = [
    {
      value: initialPosition.x,
      center: centerX.bind(null, dragItem),
    },
    {
      value: initialPosition.y,
      center: centerY.bind(null, dragItem),
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
    xOffset = Math.min(Math.max(x, 0), window.innerWidth - dragItem.clientWidth)
    yOffset = Math.min(
      Math.max(y, 0),
      window.innerHeight - dragItem.clientHeight,
    )
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
    dragItem.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`
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

  parent.addEventListener('pointerdown', dragStart, false)
  parent.addEventListener('pointerup', dragEnd, false)
  parent.addEventListener('pointermove', drag, false)

  window.addEventListener('resize', () => {
    setOffset()
    setTranslate()
  })

  setTranslate()
}

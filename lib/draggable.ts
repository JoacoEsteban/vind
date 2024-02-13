export function draggable (node: HTMLElement) {
  const friction = 0.85
  const dragItem = node

  let active = false
  let currentX: number
  let currentY: number
  let initialX: number
  let initialY: number
  let xOffset = 0
  let yOffset = 0
  let lastX: number
  let lastY: number
  let velocityX = 0
  let velocityY = 0
  let rafID: number

  function dragStart (e: PointerEvent) {
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

  function isTarget (target: HTMLElement) {
    if (target.nodeName === 'BUTTON') return false
    if (target === dragItem) return true
    if (target.parentElement) {
      return isTarget(target.parentElement)
    }
    return false
  }

  function dragEnd (e: PointerEvent) {
    initialX = currentX
    initialY = currentY
    active = false
    animate() // Start animating with the final velocity
    dragItem.releasePointerCapture(e.pointerId)
  }

  function setOffset (x = xOffset, y = yOffset) {
    xOffset = Math.min(Math.max(x, 0), window.innerWidth - dragItem.clientWidth)
    yOffset = Math.min(Math.max(y, 0), window.innerHeight - dragItem.clientHeight)
    console.log({ xOffset, yOffset })
  }

  function drag (e: PointerEvent) {
    if (!active) return
    e.preventDefault()
    currentX = e.clientX - initialX
    currentY = e.clientY - initialY

    // Calculate velocity
    velocityX = e.clientX - lastX
    velocityY = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY

    setOffset(
      currentX,
      currentY,
    )

    setTranslate()
  }

  function setTranslate () {
    dragItem.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`
  }

  function animate () {
    if (!active && (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1)) {
      // Apply friction
      velocityX *= friction
      velocityY *= friction

      setOffset(
        xOffset + velocityX,
        yOffset + velocityY,
      )
      setTranslate()

      rafID = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(rafID)
    }
  }

  const parent = (() => {
    let p = node.parentElement
    while (p && p.style.position !== 'relative') {
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
}

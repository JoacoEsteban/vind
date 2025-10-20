// draw.ts
type Point = readonly [number, number]

export function drawPolygon(points: Point[]): void {
  if (points.length < 3) return

  const canvas = getCanvas()
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  sizeToViewport(canvas, ctx)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()

  ctx.fillStyle = 'rgba(0, 128, 255, 0.35)'
  ctx.strokeStyle = 'rgb(0, 128, 255)'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.fill()
  ctx.stroke()
}

export function clearCanvas() {
  const canvas = getCanvas()
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  sizeToViewport(canvas, ctx)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function getCanvas(): HTMLCanvasElement {
  const id = '__fixed_polygon_overlay__'
  const exist = document.getElementById(id) as HTMLCanvasElement | null
  if (exist) return exist

  const c = document.createElement('canvas')
  c.id = id
  Object.assign(c.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '2147483647',
  } as const)
  document.body.appendChild(c)

  window.addEventListener(
    'resize',
    () => {
      const ctx = c.getContext('2d')
      if (!ctx) return
      sizeToViewport(c, ctx)
    },
    { passive: true },
  )

  return c
}

function sizeToViewport(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = Math.max(1, Math.floor(w * dpr))
  canvas.height = Math.max(1, Math.floor(h * dpr))
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

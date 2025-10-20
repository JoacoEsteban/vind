type Point = [number, number]
type Rect = { x: number; y: number; width: number; height: number }

const TAU = Math.PI * 2

function insideRect(r: Rect, p: Point): boolean {
  const [px, py] = p
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height
}

function normAngle(a: number): number {
  // [-PI, PI)
  a = (((a + Math.PI) % TAU) + TAU) % TAU
  return a - Math.PI
}

/**
 * Triangle formed by the projection point and the two extreme visible rectangle corners.
 * Returns [P, C1, C2]. If P lies inside the rectangle, returns null.
 */
export function projectingTriangle(
  rect: Rect,
  P: Point,
): [Point, Point, Point] | null {
  if (insideRect(rect, P)) return null

  const corners: Point[] = [
    [rect.x, rect.y], // top-left
    [rect.x + rect.width, rect.y], // top-right
    [rect.x + rect.width, rect.y + rect.height], // bottom-right
    [rect.x, rect.y + rect.height], // bottom-left
  ]

  // angles from P to corners
  const withAngles = corners.map((c, i) => {
    const a = Math.atan2(c[1] - P[1], c[0] - P[0])
    return { idx: i, angle: normAngle(a) }
  })

  // sort by angle
  withAngles.sort((a, b) => a.angle - b.angle)

  // find largest circular gap
  let maxGap = -Infinity
  let k = 0 // gap between k and k+1
  for (let i = 0; i < withAngles.length; i++) {
    const a = withAngles[i].angle
    const b =
      withAngles[(i + 1) % withAngles.length].angle +
      (i === withAngles.length - 1 ? TAU : 0)
    const gap = b - a
    if (gap > maxGap) {
      maxGap = gap
      k = i
    }
  }

  // extremes are the two corners adjacent to the largest gap
  const aIdx = withAngles[(k + 1) % withAngles.length].idx
  const bIdx = withAngles[k].idx

  const C1 = corners[aIdx]
  const C2 = corners[bIdx]

  return [P, C1, C2]
}

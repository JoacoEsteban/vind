import * as T from 'three'

export interface Viewport {
  width: number
  height: number
  factor: number
  distance: number
  aspect: number
}

const { lerp } = T.MathUtils

export function getCurrentViewport(
  camera: T.PerspectiveCamera,
  target = new T.Vector3(),
) {
  const position = new T.Vector3()
  const direction = new T.Vector3()
  const distance = camera.position.distanceTo(target)

  // Get camera position and direction
  camera.getWorldPosition(position)
  camera.getWorldDirection(direction)

  // Calculate vertical FOV in radians
  const fov = (camera.fov * Math.PI) / 180

  // Calculate viewport height
  const viewportHeight = 2 * Math.tan(fov / 2) * distance
  const viewportWidth = viewportHeight * camera.aspect

  // Calculate screen width factors
  const factor = Math.abs(direction.dot(new T.Vector3(0, 0, 1)))
  const width = lerp(
    Math.abs(viewportWidth),
    Math.abs(viewportHeight * camera.aspect),
    factor,
  )
  const height = lerp(
    Math.abs(viewportHeight),
    Math.abs(viewportWidth / camera.aspect),
    factor,
  )

  return {
    width,
    height,
    factor,
    distance,
    aspect: camera.aspect,
    // Additional properties similar to R3F
    isOrthographic: !camera.isPerspectiveCamera,
    isPerspectiveCamera: camera.isPerspectiveCamera,
    position: position.toArray(),
    target: target.toArray(),
    zoom: camera.zoom,
  }
}

<script lang="ts">
  import * as T from 'three'
  import {
    Subject,
    fromEvent,
    filter,
    map,
    startWith,
    combineLatest,
    BehaviorSubject,
    withLatestFrom,
  } from 'rxjs'
  import { getCurrentViewport, type Viewport } from '../three'
  import { repeat } from '~lib/generator'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
  import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass'
  import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'
  import { svelteCompat, ToggleSubject, VoidSubject } from '~lib/rxjs'
  import CrabModel from 'raw:../../static/models/crab/little_hermit_crab-v2.glb'
  import { mix, cubicBezier } from 'motion'
  import { documentVisiblity$ } from '~lib/animation-state'
  import chroma from 'chroma-js'
  import { generateId } from '~lib/id'
  import ColorHash from 'color-hash'

  type FrameContext = [
    renderer: T.WebGLRenderer,
    viewport: Viewport,
    camera: T.PerspectiveCamera,
    composer: EffectComposer,
    frustum: T.Frustum,
  ]
  type SceneMesh = {
    mesh: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>
    position: T.Vector3
    rotation: T.Vector3
    scale: number
  }
  type SceneParticles = {
    points: T.Points
    positions: [number, number, number][]
  }

  const colorHash = new ColorHash()

  export let spin$: VoidSubject
  export let colorSeed = generateId()
  export let onColorChange: undefined | ((e: string) => void)

  let baseModelMap: T.Texture | null = null
  const hueShift$ = svelteCompat(new BehaviorSubject('311')).pipe(
    map((val) => parseInt(val)),
  )

  $: {
    const color = chroma(colorHash.hex(colorSeed))
    const backgroundColor = color.set('hsl.s', 1)
    const materialColor = color
      .set('hsl.h', '+25')
      .set('hsl.l', '.5')
      .set('hsl.s', '1')
    const emissiveColor = materialColor.set('hsl.h', '+45').set('hsl.l', '.05')
    const particlesColor = color.set('hsl.s', '1').set('hsl.l', '.75')

    colors$.next({
      color: new T.Color(color.hex()),
      background: new T.Color(backgroundColor.hex()),
      material: new T.Color(materialColor.hex()),
      emissive: new T.Color(emissiveColor.hex()),
      particles: new T.Color(particlesColor.hex()),
    })
    onColorChange?.(color.hex())
  }

  const loader = new GLTFLoader()
  loader.load(CrabModel, (model) => {
    const [mesh] = model.scene.children as SceneMesh['mesh'][]
    baseModelMap = mesh.material.map?.clone() ?? null
    mesh.material.roughness = 0.5
    mesh.material.metalness = 0.99
    mesh$.next(mesh)
  })

  const scene = new T.Scene()
  const fov = 40
  const aspect = 2 // the canvas default
  const near = 0.1
  const maxPixelRatio = 1
  const far = 100
  const meshCount = far
  const particleCount = 5000
  const clock = new T.Clock(true)
  const baseSpin = 0.003
  const spinAcceleration = 0.2
  const spinDuration = 2000

  const meshes$ = new Subject<SceneMesh[]>()
  const particles$ = new Subject<SceneParticles>()
  const mesh$ = new Subject<SceneMesh['mesh']>()
  const context$ = new Subject<FrameContext>()
  const frame$ = new Subject<FrameContext>()
  const paused$ = new ToggleSubject()
  const spinFrom$ = spin$.pipe(
    map(() => performance.now()),
    startWith(performance.now() - spinDuration),
  )
  const colors$ = new Subject<{
    color: T.Color
    background: T.Color
    material: T.Color
    emissive: T.Color
    particles: T.Color
  }>()

  const mixAcceleration = ((doMix, easing) => (val: number) => {
    return doMix(easing(val))
  })(mix(1, 0), cubicBezier(0.23, 1, 0.32, 1))

  function buildMeshes(
    num: number,
    model: SceneMesh['mesh'],
    camera: T.PerspectiveCamera,
  ): SceneMesh[] {
    const ret = []

    for (let i of repeat(num)) {
      const mesh = model.clone(false)
      const distance = -i % far
      const scale = 0.5 + -distance / 30

      const { height } = getCurrentViewport(
        camera,
        new T.Vector3(0, 0, distance),
      )

      const position = new T.Vector3(
        T.MathUtils.randFloatSpread(2),
        T.MathUtils.randFloatSpread(height),
        distance + scale * 3,
      )
      const rotation = new T.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )
      mesh.position.set(position.x, position.y, position.z)
      mesh.rotation.set(rotation.x, rotation.y, rotation.z)
      mesh.scale.setScalar(scale)

      ret.push({
        position,
        rotation,
        mesh,
        scale,
      })
    }

    return ret
  }

  function buildParticles(num: number, camera: T.PerspectiveCamera) {
    const positions = [] as [number, number, number][]
    const particlesGeometry = new T.BufferGeometry()
    const geometryPositions = new Float32Array(num * 3)
    const particlesMaterial = new T.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
    })

    for (let i of repeat(num)) {
      const distance = -i % far
      const { height } = getCurrentViewport(
        camera,
        new T.Vector3(0, 0, distance),
      )

      const [x, y, z] = ([
        geometryPositions[i * 3],
        geometryPositions[i * 3 + 1],
        geometryPositions[i * 3 + 2],
      ] = [
        T.MathUtils.randFloatSpread(2),
        T.MathUtils.randFloatSpread(height),
        distance,
      ])
      positions.push([x, y, z])
    }

    particlesGeometry.setAttribute(
      'position',
      new T.BufferAttribute(geometryPositions, 3),
    )

    return {
      points: new T.Points(particlesGeometry, particlesMaterial),
      positions,
    }
  }

  function setRatio([renderer, , camera, composer, frustum]: FrameContext) {
    ;[renderer, composer].forEach((obj) => {
      obj.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
      obj.setSize(window.innerWidth, window.innerHeight)
    })
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    frustum.setFromProjectionMatrix(
      new T.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    )
  }

  function moveMesh(
    [, , camera, , frustum]: FrameContext,
    { mesh, position, rotation }: SceneMesh,
    delta: number,
    rotationDelta: number,
    now: number,
  ) {
    const { width, height } = getCurrentViewport(
      camera,
      new T.Vector3(0, 0, position.z),
    )

    // mesh.position.y = position.y += delta * 2

    mesh.rotation.x += rotationDelta * rotation.x * 0.2
    mesh.rotation.y += rotationDelta * rotation.y * 0.2
    mesh.rotation.z += rotationDelta * rotation.z

    const valY = (mesh.position.y = position.y += delta * 2)
    mesh.position.x = position.x * width + Math.sin(now / 5000) * 10
    mesh.position.z = position.z

    if (valY > 0) {
      mesh.geometry.computeBoundingBox()
      if (!mesh.geometry.boundingBox) throw new Error('No bounding box')

      const visible = frustum.intersectsObject(mesh)

      const size = new T.Vector3()
      mesh.geometry.boundingBox?.getSize(size)

      const meshHeight = size.y

      if (!visible) {
        const corrected = (valY % height) - height - height / 2 - meshHeight
        mesh.position.y = position.y = corrected
      }
    }
  }

  function moveParticles(
    [, , camera]: FrameContext,
    { points, positions }: SceneParticles,
    delta: number,
    now: number,
  ) {
    const geo = points.geometry
    const arr = geo.attributes.position.array
    for (let i of repeat(geo.attributes.position.array.length / 3)) {
      const [x, y, z] = positions[i]
      const { width, height } = getCurrentViewport(
        camera,
        new T.Vector3(0, 0, arr[i * 3 + 2]),
      )
      arr[i * 3] = x * width + Math.sin(now / 5000) * 10

      const val = (arr[i * 3 + 1] += delta * 2)
      const to = height / 2
      if (val > to) {
        const corrected = (val % height) - height
        arr[i * 3 + 1] = corrected
      }
    }
    geo.attributes.position.needsUpdate = true
  }

  function mounted(canvas: Node) {
    const renderer = new T.WebGLRenderer({ antialias: true, canvas })
    const composer = new EffectComposer(renderer)
    const camera = new T.PerspectiveCamera(fov, aspect, near, far)
    const frustum = new T.Frustum()

    renderer.outputColorSpace = T.SRGBColorSpace
    camera.position.z = 5

    const passes = [
      new RenderPass(scene, camera),
      new BokehPass(scene, camera, {
        aperture: 0.25,
        focus: 20,
        maxblur: 0.007,
      }),
      new ShaderPass(GammaCorrectionShader),
    ]
    passes.forEach((pass) => composer.addPass(pass))

    const viewport = getCurrentViewport(camera)
    const context = [
      renderer,
      viewport,
      camera,
      composer,
      frustum,
    ] as FrameContext

    const light = new T.SpotLight('white', 5000, 0, Math.PI * 0.9)
    light.position.set(10, 10, 10)
    scene.add(light)

    setRatio(context)
    particles$.next(buildParticles(particleCount, camera))

    context$.next(context)
    mesh$.subscribe((model) => {
      meshes$.next(buildMeshes(meshCount, model, camera))
      window.requestAnimationFrame(function render() {
        frame$.next(context)
        requestAnimationFrame(render)
      })
    })
  }

  // ------------------------------------------------------------------------

  fromEvent(window, 'resize')
    .pipe(withLatestFrom(frame$))
    .subscribe(([, context]) => setRatio(context))

  meshes$.subscribe((meshes) => meshes.forEach((box) => scene.add(box.mesh)))
  particles$.subscribe((particles) => scene.add(particles.points))

  combineLatest([context$, colors$, mesh$, particles$, hueShift$]).subscribe(
    ([
      [renderer],
      {
        background: backgroundColor,
        material: materialColor,
        emissive: emissiveColor,
        particles: particlesColor,
      },
      model,
      particles,
      hueShift,
    ]) => {
      renderer.setClearColor(backgroundColor, 1)

      model.material.emissive.set(emissiveColor)
      ;(particles.points.material as T.PointsMaterial).color.set(particlesColor)

      const texture = baseModelMap
      if (!texture) throw new Error('no texture')

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no ctx')

      canvas.width = texture.image.width
      canvas.height = texture.image.height

      ctx.drawImage(texture.image, 0, 0)

      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = pixels.data
      const [h] = chroma(materialColor.getHex()).hsl()
      const offset = Math.ceil((h + hueShift) % 360)

      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]]

        const [r2, g2, b2] = chroma
          .rgb(r, g, b)
          .set('hsl.h', `+${offset}`)
          .set('hsl.l', '.5')
          .rgb()

        ;[data[i], data[i + 1], data[i + 2]] = [r2, g2, b2]
      }

      ctx.putImageData(pixels, 0, 0)

      const canvasTexture = new T.CanvasTexture(canvas)
      model.material.map = canvasTexture
    },
  )

  frame$
    .pipe(
      withLatestFrom(
        meshes$,
        paused$,
        spinFrom$,
        documentVisiblity$,
        particles$,
      ),
      filter(([, , , , hidden]) => !hidden),
    )
    .forEach(([context, meshes, paused, spinFrom, , particles]) => {
      const [, , , composer] = context
      const delta = clock.getDelta()
      const now = performance.now()
      const progress = Math.min((now - spinFrom) / spinDuration, 1)

      const rotationDelta =
        baseSpin + spinAcceleration * mixAcceleration(progress)

      if (!paused) {
        meshes.forEach((mesh) =>
          moveMesh(context, mesh, delta, rotationDelta, now),
        )
        moveParticles(context, particles, delta, now)
      }
      composer.render()
    })
</script>

<canvas class="fixed top-0 left-0 right-0" use:mounted></canvas>

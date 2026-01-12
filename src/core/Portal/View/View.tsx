import * as React from 'react'
import * as THREE from '#three'
import { RootState, context, createPortal, useFrame, useThree } from '@react-three/fiber'
import tunnel from 'tunnel-rat'

const isOrthographicCamera = (def: any): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera

//* WebGPU Detection ==============================
// WebGPU uses top-left origin, WebGL uses bottom-left
const isWebGPURenderer = (def: any): boolean => !!(def as any).isWebGPURenderer

const col = /* @__PURE__ */ new THREE.Color()

// Use a global singleton for tunnel to survive HMR
// When HMR reloads this module, we reuse the existing tunnel instance
const TUNNEL_KEY = '__drei_view_tunnel__'
const tracked: ReturnType<typeof tunnel> =
  (globalThis as any)[TUNNEL_KEY] || ((globalThis as any)[TUNNEL_KEY] = tunnel())

type CanvasSize = {
  top: number
  left: number
  height: number
  width: number
}

export type ContainerProps = {
  visible: boolean
  scene: THREE.Scene
  index: number
  children?: React.ReactNode
  frames: number
  rect: React.RefObject<DOMRect>
  /**
   * @deprecated You can use inline Views now, see: https://github.com/pmndrs/drei/pull/1784
   */
  track?: React.RefObject<HTMLElement>
  canvasSize: CanvasSize
}

export type ViewProps = {
  /** Root element type, default: div */
  as?: string
  /** CSS id prop */
  id?: string
  /** CSS classname prop */
  className?: string
  /** CSS style prop */
  style?: React.CSSProperties
  /** If the view is visible or not, default: true */
  visible?: boolean
  /** Views take over the render loop, optional render index (1 by default) */
  index?: number
  /** If you know your view is always at the same place set this to 1 to avoid needless getBoundingClientRect overhead */
  frames?: number
  /** The scene to render, if you leave this undefined it will render the default scene */
  children?: React.ReactNode
  /** The tracking element, the view will be cut according to its whereabouts
   * @deprecated You can use inline Views now, see: https://github.com/pmndrs/drei/pull/1784
   */
  track?: React.RefObject<HTMLElement>
}

function computeContainerPosition(canvasSize: CanvasSize, trackRect: DOMRect) {
  const { right, top: trackTop, left: trackLeft, bottom: trackBottom, width, height } = trackRect
  const isOffscreen =
    trackRect.bottom < 0 || trackTop > canvasSize.height || right < 0 || trackRect.left > canvasSize.width

  const canvasBottom = canvasSize.top + canvasSize.height
  const bottom = canvasBottom - trackBottom
  const left = trackLeft - canvasSize.left
  // Calculate top relative to canvas for WebGPU coordinate system
  const top = trackTop - canvasSize.top
  return { position: { width, height, left, top, bottom, right }, isOffscreen }
}

function prepareSkissor(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  {
    left,
    top,
    bottom,
    width,
    height,
  }: { width: number; height: number; top: number; left: number; bottom: number; right: number }
) {
  let autoClear

  //* Camera Setup ==============================
  const aspect = width / height
  if (isOrthographicCamera(camera)) {
    if (!(camera as any).manual) {
      if (
        camera.left !== width / -2 ||
        camera.right !== width / 2 ||
        camera.top !== height / 2 ||
        camera.bottom !== height / -2
      ) {
        Object.assign(camera, { left: width / -2, right: width / 2, top: height / 2, bottom: height / -2 })
      }
    }
  } else if ((camera as THREE.PerspectiveCamera).aspect !== aspect) {
    ;(camera as THREE.PerspectiveCamera).aspect = aspect
  }
  ;(camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).updateProjectionMatrix()

  //* Scissor Setup ==============================
  autoClear = renderer.autoClear
  renderer.autoClear = false
  // WebGPU uses top-left origin (use top), WebGL uses bottom-left (use bottom)
  // Use initialEdge to determine whether to use 'top' or 'bottom' as the starting edge
  const initialEdge = isWebGPURenderer(renderer) ? top : bottom
  renderer.setViewport(left, initialEdge, width, height)
  renderer.setScissor(left, initialEdge, width, height)
  renderer.setScissorTest(true)
  return autoClear
}

function finishSkissor(renderer: THREE.WebGLRenderer, autoClear: boolean) {
  // Restore the default state
  renderer.setScissorTest(false)
  renderer.autoClear = autoClear
}

function clear(renderer: THREE.WebGLRenderer) {
  renderer.getClearColor(col)
  renderer.setClearColor(col, renderer.getClearAlpha())
  renderer.clear(true, true)
}

function Container({ visible = true, canvasSize, scene, index, children, frames, rect, track }: ContainerProps) {
  // Get portal's scene, camera, renderer, and store via useThree (works around bug where useFrame state is root state)
  const { scene: portalScene, camera: portalCamera, renderer, get, setEvents } = useThree()
  const [isOffscreen, setOffscreen] = React.useState(false)

  // Guard against rendering during unmount (prevents WebGPU buffer-after-destroy errors)
  const mountedRef = React.useRef(true)
  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  let frameCount = 0
  useFrame(
    () => {
      // Skip rendering if component is unmounting (prevents WebGPU destroyed buffer errors)
      if (!mountedRef.current) return

      if (frames === Infinity || frameCount <= frames) {
        if (track) rect.current = track.current?.getBoundingClientRect()
        frameCount++
      }
      if (rect.current) {
        const { position, isOffscreen: _isOffscreen } = computeContainerPosition(canvasSize, rect.current)
        if (isOffscreen !== _isOffscreen) setOffscreen(_isOffscreen)

        // Use fresh _isOffscreen value instead of potentially stale state
        if (visible && !_isOffscreen && rect.current) {
          // Use portal's scene/camera from useThree (useFrame state is root due to r3f bug)
          const targetScene = children ? portalScene : scene
          const targetCamera = portalCamera

          const autoClear = prepareSkissor(renderer, targetCamera, position)

          // Clear the scissored region before rendering (scene.background won't clear since autoClear is off)
          if (targetScene.background) {
            if (targetScene.background instanceof THREE.Color) {
              renderer.setClearColor(targetScene.background, 1)
            }
            renderer.clear(true, true)
          }
          // When children are present render the portalled scene, otherwise the default scene
          renderer.render(targetScene, targetCamera)
          finishSkissor(renderer, autoClear)
        }
      }
    },
    { after: 'render', priority: index }
  )

  React.useLayoutEffect(() => {
    const curRect = rect.current
    if (curRect && (!visible || !isOffscreen)) {
      // If the view is not visible clear it once, but stop rendering afterwards!
      const { position, isOffscreen: _isOffscreen } = computeContainerPosition(canvasSize, curRect)
      if (!_isOffscreen) {
        const autoClear = prepareSkissor(renderer, portalCamera, position)
        clear(renderer)
        finishSkissor(renderer, autoClear)
      }
    }
  }, [visible, isOffscreen, renderer, portalCamera, canvasSize])

  React.useEffect(() => {
    if (!track) return

    const curRect = rect.current
    // Connect the event layer to the tracking element
    const old = get().events.connected
    setEvents({ connected: track.current })
    return () => {
      if (curRect) {
        const { position, isOffscreen: _isOffscreen } = computeContainerPosition(canvasSize, curRect)
        if (!_isOffscreen) {
          const autoClear = prepareSkissor(renderer, portalCamera, position)
          clear(renderer)
          finishSkissor(renderer, autoClear)
        }
      }
      setEvents({ connected: old })
    }
  }, [track, renderer, portalCamera, canvasSize, get, setEvents])

  return (
    <>
      {children}
      {/** Without an element that receives pointer events state.pointer will always be 0/0 */}
      <group onPointerOver={() => null} />
    </>
  )
}

const CanvasView = /* @__PURE__ */ React.forwardRef(
  (
    { track, visible = true, index = 1, id, style, className, frames = Infinity, children, ...props }: ViewProps,
    fref: React.ForwardedRef<THREE.Group>
  ) => {
    const rect = React.useRef<DOMRect>(null!)
    const { size, scene } = useThree()
    const [virtualScene] = React.useState(() => new THREE.Scene())
    const [ready, toggle] = React.useReducer(() => true, false)

    const compute = React.useCallback(
      (event, state) => {
        if (rect.current && track && track.current && event.target === track.current) {
          const { width, height, left, top } = rect.current
          const x = event.clientX - left
          const y = event.clientY - top
          state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
          state.raycaster.setFromCamera(state.pointer, state.camera)
        }
      },
      [rect, track]
    )

    React.useEffect(() => {
      // We need the tracking elements bounds beforehand in order to inject it into the portal
      if (track) rect.current = track.current?.getBoundingClientRect()
      // And now we can proceed
      toggle()
    }, [track])

    return (
      <group ref={fref} {...props}>
        {ready &&
          createPortal(
            <Container
              visible={visible}
              canvasSize={size}
              frames={frames}
              scene={scene}
              track={track}
              rect={rect}
              index={index}
            >
              {children}
            </Container>,
            virtualScene,
            {
              events: { compute, priority: index },
              size: {
                width: rect.current?.width,
                height: rect.current?.height,
                // @ts-ignore
                top: rect.current?.top,
                // @ts-ignore
                left: rect.current?.left,
              },
            }
          )}
      </group>
    )
  }
)

const HtmlView = /* @__PURE__ */ React.forwardRef(
  (
    {
      as: El = 'div',
      id,
      visible,
      className,
      style,
      index = 1,
      track,
      frames = Infinity,
      children,
      ...props
    }: ViewProps,
    fref: React.ForwardedRef<HTMLElement>
  ) => {
    const uuid = React.useId()
    const ref = React.useRef<HTMLElement>(null!)
    React.useImperativeHandle(fref, () => ref.current)

    return (
      <>
        {/** @ts-ignore */}
        <El ref={ref} id={id} className={className} style={style} {...props} />
        <tracked.In>
          <CanvasView visible={visible} key={uuid} track={ref} frames={frames} index={index}>
            {children}
          </CanvasView>
        </tracked.In>
      </>
    )
  }
)

export type ViewportProps = { Port: () => React.JSX.Element } & React.ForwardRefExoticComponent<
  ViewProps & React.RefAttributes<HTMLElement | THREE.Group>
>

/**
 * Uses renderer.scissor to create viewport segments tied to HTML tracking elements.
 * Allows multiple views with a single canvas. Views follow their tracking elements,
 * scroll, resize, etc. Use View.Port inside Canvas to render all views.
 *
 * @example Inline views with shared canvas
 * ```jsx
 * <main ref={container}>
 *   <View style={{ width: 200, height: 200 }}>
 *     <mesh /><OrbitControls />
 *   </View>
 *   <View className="view-2">
 *     <mesh /><CameraControls />
 *   </View>
 *   <Canvas eventSource={container}>
 *     <View.Port />
 *   </Canvas>
 * </main>
 * ```
 */
export const View = /* @__PURE__ */ (() => {
  const _View = React.forwardRef((props: ViewProps, fref: React.ForwardedRef<HTMLElement | THREE.Group>) => {
    // If we're inside a canvas we should be able to access the context store
    const store = React.useContext(context)
    // If that's not the case we render a tunnel
    if (!store) return <HtmlView ref={fref as unknown as React.ForwardedRef<HTMLElement>} {...props} />
    // Otherwise a plain canvas-view
    else return <CanvasView ref={fref as unknown as React.ForwardedRef<THREE.Group>} {...props} />
  }) as ViewportProps

  _View.Port = () => <tracked.Out />

  return _View
})()

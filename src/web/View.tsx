import * as React from 'react'
import * as THREE from 'three/webgpu'
import { type RootState, context, createPortal, useFrame, useThree } from '@react-three/fiber'
import tunnel from 'tunnel-rat'

const isOrthographicCamera = (def: any): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera
const col = /* @__PURE__ */ new THREE.Color()
const tracked = /* @__PURE__ */ tunnel()

// Reusable objects for performance
const _vec2 = /* @__PURE__ */ new THREE.Vector2()
const _savedClearColor = /* @__PURE__ */ new THREE.Color()
let _savedClearAlpha = 1

// Type for computeContainerPosition return value
type ContainerPosition = {
  position: {
    width: number
    height: number
    left: number
    top: number
    bottom: number
    right: number
  }
  isOffscreen: boolean
}

// Cache rect values instead of DOMRect objects for effective memoization
type RectValues = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

// Memoization cache for computeContainerPosition
const positionCache = new Map<string, { canvasSize: CanvasSize; result: ContainerPosition }>()

// Helper to create cache key from rect values
function getRectCacheKey(rect: RectValues, canvasSize: CanvasSize): string {
  return `${rect.left},${rect.top},${rect.width},${rect.height},${canvasSize.left},${canvasSize.top},${canvasSize.width},${canvasSize.height}`
}

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

function computeContainerPosition(canvasSize: CanvasSize, trackRect: RectValues | DOMRect): ContainerPosition {
  // Check cache first using rect values
  const cacheKey = getRectCacheKey(trackRect, canvasSize)
  const cached = positionCache.get(cacheKey)
  if (cached) {
    return cached.result
  }
  const { right, top, left: trackLeft, width, height } = trackRect

  // Calculate position relative to canvas viewport
  const relativeLeft = trackLeft - canvasSize.left
  const relativeTop = top - canvasSize.top

  let bottom: number
  bottom = canvasSize.height - relativeTop - height

  // Check if element is offscreen
  const isOffscreen =
    relativeTop + height < 0 ||
    relativeTop > canvasSize.height ||
    relativeLeft + width < 0 ||
    relativeLeft > canvasSize.width

  // Clamp values but maintain the original dimensions
  const clampedLeft = Math.floor(relativeLeft)
  const clampedBottom = Math.floor(bottom)
  const clampedWidth = Math.floor(width)
  const clampedHeight = Math.floor(height)

  const result = {
    position: {
      width: Math.max(1, clampedWidth),
      height: Math.max(1, clampedHeight),
      left: clampedLeft,
      top: Math.floor(relativeTop),
      bottom: clampedBottom,
      right: right,
    },
    isOffscreen,
  }

  // Cache the result with rect values as key
  positionCache.set(cacheKey, { canvasSize: { ...canvasSize }, result })

  // Clean up old cache entries if too many
  if (positionCache.size > 100) {
    const firstKey = positionCache.keys().next().value
    if (firstKey) {
      positionCache.delete(firstKey)
    }
  }

  return result
}

function isWebGPURenderer(renderer: any): boolean {
  return renderer.backend && renderer.backend.isWebGPUBackend
}

function prepareScissor(
  state: RootState,
  {
    left,
    width,
    height,
    top,
  }: {
    width: number
    height: number
    top: number
    left: number
    right: number
  }
) {
  let autoClear
  const aspect = width / height

  // Get renderer size - reuse existing Vector2
  const rendererSize = state.gl.getSize(_vec2)

  // For WebGPU, we need to handle the coordinate system differently
  let scissorX, scissorY, scissorWidth, scissorHeight

  const visibleLeft = Math.max(0, left)
  const visibleTop = Math.max(0, top)
  const visibleRight = Math.min(rendererSize.x, left + width)
  const visibleBottom = Math.min(rendererSize.y, top + height)

  // Scissor coordinates must be within [0, renderTarget.dimension - 1]
  // This prevents "Scissor rect is not contained in render target dimensions" errors
  scissorX = Math.max(0, Math.min(rendererSize.x - 1, Math.floor(visibleLeft)))
  scissorY = Math.max(0, Math.min(rendererSize.y - 1, Math.floor(visibleTop)))

  // Scissor dimensions must not extend beyond render target edges
  // Calculate maximum allowed dimensions from scissor position
  const maxWidth = rendererSize.x - scissorX
  const maxHeight = rendererSize.y - scissorY

  scissorWidth = Math.max(1, Math.min(maxWidth, Math.floor(visibleRight - visibleLeft)))
  scissorHeight = Math.max(1, Math.min(maxHeight, Math.floor(visibleBottom - visibleTop)))

  const clampedLeft = scissorX
  const clampedBottom = scissorY
  const clampedWidth = scissorWidth
  const clampedHeight = scissorHeight

  if (isOrthographicCamera(state.camera)) {
    if (!state.camera.manual) {
      // Use original dimensions for camera, not clamped ones
      if (
        state.camera.left !== width / -2 ||
        state.camera.right !== width / 2 ||
        state.camera.top !== height / 2 ||
        state.camera.bottom !== height / -2
      ) {
        Object.assign(state.camera, {
          left: width / -2,
          right: width / 2,
          top: height / 2,
          bottom: height / -2,
        })
        state.camera.updateProjectionMatrix()
      }
    } else {
      state.camera.updateProjectionMatrix()
    }
  } else if (state.camera.aspect !== aspect) {
    state.camera.aspect = aspect
    state.camera.updateProjectionMatrix()
  }

  autoClear = state.gl.autoClear
  state.gl.autoClear = false

  const offsetX = left < 0 ? -left : 0
  const offsetY = top < 0 ? -top : 0

  state.gl.setViewport(clampedLeft - offsetX, clampedBottom - offsetY, width, height)

  state.gl.setScissor(clampedLeft, clampedBottom, clampedWidth, clampedHeight)

  state.gl.getClearColor(_savedClearColor)
  _savedClearAlpha = state.gl.getClearAlpha()
  state.gl.setClearColor(col.setRGB(0, 0, 0), 0)
  state.gl.clear(true, false, false)
  state.gl.setClearColor(_savedClearColor, _savedClearAlpha)

  return autoClear
}

function finishScissor(state: RootState, autoClear: boolean) {
  // Restore the default state
  state.gl.setScissorTest(false)
  state.gl.autoClear = autoClear
}

function clear(state: RootState) {
  state.gl.clear(true, true, false)
}

function Container({ visible = true, canvasSize, scene, index, children, frames, rect, track }: ContainerProps) {
  const rootState = useThree()
  const [isOffscreen, setOffscreen] = React.useState(false)
  const prevRectRef = React.useRef<RectValues | null>(null)
  const frameCountRef = React.useRef(0)
  const isWebGPU = React.useMemo(() => isWebGPURenderer(rootState.gl), [rootState.gl])

  useFrame((state) => {
    // Early return if not visible
    if (!visible) return

    // Update rect if needed
    if (frames === Infinity || frameCountRef.current <= frames) {
      if (track && track.current) {
        const domRect = track.current.getBoundingClientRect()
        const newRect: RectValues = {
          left: domRect.left,
          top: domRect.top,
          right: domRect.right,
          bottom: domRect.bottom,
          width: domRect.width,
          height: domRect.height,
        }

        // Check if rect actually changed
        if (
          !prevRectRef.current ||
          prevRectRef.current.left !== newRect.left ||
          prevRectRef.current.top !== newRect.top ||
          prevRectRef.current.width !== newRect.width ||
          prevRectRef.current.height !== newRect.height
        ) {
          rect.current = domRect
          prevRectRef.current = newRect
        }
      }
      frameCountRef.current++
    }

    const { position, isOffscreen: _isOffscreen } = computeContainerPosition(canvasSize, rect.current)

    if (isOffscreen !== _isOffscreen) setOffscreen(_isOffscreen)

    if (isOffscreen) {
      return
    }

    if (visible && !isOffscreen && rect.current) {
      if (isWebGPU) {
        if (index === 1) {
          state.gl.setScissorTest(false)
          state.gl.clear(true, true, true) // Clear color, depth, and stencil
        }
      }
      const autoClear = prepareScissor(state, position)
      clear(state)
      // When children are present render the portalled scene, otherwise the default scene
      state.gl.render(children ? state.scene : scene, state.camera)
      finishScissor(state, autoClear)
    }
  }, index)

  React.useLayoutEffect(() => {
    const curRect = rect.current
    if (curRect && !visible) {
      // If the view is not visible clear it once, but stop rendering afterwards!
      const { position } = computeContainerPosition(canvasSize, curRect)
      const autoClear = prepareScissor(rootState, position)
      clear(rootState)
      finishScissor(rootState, autoClear)
    }
  }, [visible, canvasSize, rootState])

  React.useEffect(() => {
    if (!track) return

    const curRect = rect.current
    // Connect the event layer to the tracking element
    const old = rootState.get().events.connected
    rootState.setEvents({ connected: track.current })
    return () => {
      if (curRect) {
        const { position } = computeContainerPosition(canvasSize, curRect)
        const autoClear = prepareScissor(rootState, position)
        clear(rootState)
        finishScissor(rootState, autoClear)
      }
      rootState.setEvents({ connected: old })
    }
  }, [track])

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
      (event: any, state: any) => {
        if (rect.current && track && track.current && event.target === track.current) {
          const { width, height, left, top } = rect.current
          const x = event.clientX - left
          const y = event.clientY - top
          state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
          state.raycaster.setFromCamera(state.pointer, state.camera)
        }
      },
      [track]
    )

    React.useEffect(() => {
      // We need the tracking elements bounds beforehand in order to inject it into the portal
      if (track && track.current) {
        rect.current = track.current.getBoundingClientRect()

        // And now we can proceed
        toggle()
      }
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
    const rectRef = React.useRef<DOMRect | null>(null)

    React.useImperativeHandle(fref, () => ref.current)

    // Use ResizeObserver for better performance
    React.useEffect(() => {
      if (!ref.current) return

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          rectRef.current = entry.target.getBoundingClientRect()
        }
      })

      observer.observe(ref.current)
      rectRef.current = ref.current.getBoundingClientRect()

      return () => observer.disconnect()
    }, [])

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

export type ViewportProps = {
  Port: () => React.JSX.Element
} & React.ForwardRefExoticComponent<ViewProps & React.RefAttributes<HTMLElement | THREE.Group>>

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

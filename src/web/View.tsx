import * as React from 'react'
import * as THREE from 'three'
import { context, createPortal, useFrame, useThree } from '@react-three/fiber'
import tunnel from 'tunnel-rat'

const isOrthographicCamera = (def: any): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera
const col = /* @__PURE__ */ new THREE.Color()
const tracked = /* @__PURE__ */ tunnel()

/**
 * In `@react-three/fiber` after `v8.0.0` but prior to `v8.1.0`, `state.size` contained only dimension
 * information. After `v8.1.0`, position information (`top`, `left`) was added
 *
 * @todo remove this when drei supports v9 and up
 */
type LegacyCanvasSize = {
  height: number
  width: number
}

type CanvasSize = LegacyCanvasSize & {
  top: number
  left: number
}

function isNonLegacyCanvasSize(size: Record<string, number>): size is CanvasSize {
  return 'top' in size
}

export type ContainerProps = {
  scene: THREE.Scene
  index: number
  children?: React.ReactNode
  frames: number
  rect: React.MutableRefObject<DOMRect>
  track: React.MutableRefObject<HTMLElement>
  canvasSize: LegacyCanvasSize | CanvasSize
}

export type ViewProps = {
  /** Root element, default: "div" */
  as?: string
  id?: string
  className?: string
  style?: React.CSSProperties
  /** The tracking element, the view will be cut according to its whereabouts */
  track: React.MutableRefObject<HTMLElement>
  /** Views take over the render loop, optional render index (1 by default) */
  index?: number
  /** If you know your view is always at the same place set this to 1 to avoid needless getBoundingClientRect overhead */
  frames?: number
  /** The scene to render, if you leave this undefined it will render the default scene */
  children?: React.ReactNode
}

function computeContainerPosition(
  canvasSize: LegacyCanvasSize | CanvasSize,
  trackRect: DOMRect
): {
  position: CanvasSize & { bottom: number; right: number }
  isOffscreen: boolean
} {
  const { right, top, left: trackLeft, bottom: trackBottom, width, height } = trackRect
  const isOffscreen = trackRect.bottom < 0 || top > canvasSize.height || right < 0 || trackRect.left > canvasSize.width

  if (isNonLegacyCanvasSize(canvasSize)) {
    const canvasBottom = canvasSize.top + canvasSize.height
    const bottom = canvasBottom - trackBottom
    const left = trackLeft - canvasSize.left
    return { position: { width, height, left, top, bottom, right }, isOffscreen }
  }

  // Fall back on old behavior if r3f < 8.1.0
  const bottom = canvasSize.height - trackBottom
  return { position: { width, height, top, left: trackLeft, bottom, right }, isOffscreen }
}

function Container({ canvasSize, scene, index, children, frames, rect, track }: ContainerProps) {
  const get = useThree((state) => state.get)
  const camera = useThree((state) => state.camera)
  const virtualScene = useThree((state) => state.scene)
  const setEvents = useThree((state) => state.setEvents)

  let autoClear
  let frameCount = 0
  useFrame((state) => {
    if (frames === Infinity || frameCount <= frames) {
      rect.current = track.current?.getBoundingClientRect()
      frameCount++
    }

    if (rect.current) {
      const {
        position: { left, bottom, width, height },
        isOffscreen,
      } = computeContainerPosition(canvasSize, rect.current)

      const aspect = width / height

      if (isOrthographicCamera(camera)) {
        if (
          camera.left !== width / -2 ||
          camera.right !== width / 2 ||
          camera.top !== height / 2 ||
          camera.bottom !== height / -2
        ) {
          Object.assign(camera, { left: width / -2, right: width / 2, top: height / 2, bottom: height / -2 })
          camera.updateProjectionMatrix()
        }
      } else if (camera.aspect !== aspect) {
        camera.aspect = aspect
        camera.updateProjectionMatrix()
      }

      autoClear = state.gl.autoClear
      state.gl.autoClear = false
      state.gl.setViewport(left, bottom, width, height)
      state.gl.setScissor(left, bottom, width, height)
      state.gl.setScissorTest(true)

      if (isOffscreen) {
        state.gl.getClearColor(col)
        state.gl.setClearColor(col, state.gl.getClearAlpha())
        state.gl.clear(true, true)
      } else {
        // When children are present render the portalled scene, otherwise the default scene
        state.gl.render(children ? virtualScene : scene, camera)
      }
      // Restore the default state
      state.gl.setScissorTest(false)
      state.gl.autoClear = autoClear
    }
  }, index)

  React.useEffect(() => {
    // Connect the event layer to the tracking element
    const old = get().events.connected
    setEvents({ connected: track.current })
    return () => setEvents({ connected: old })
  }, [])

  React.useEffect(() => {
    if (isNonLegacyCanvasSize(canvasSize)) {
      return
    }
    console.warn(
      'Detected @react-three/fiber canvas size does not include position information. <View /> may not work as expected. ' +
        'Upgrade to @react-three/fiber ^8.1.0 for support.\n See https://github.com/pmndrs/drei/issues/944'
    )
  }, [])

  return <>{children}</>
}

const CanvasView = React.forwardRef(
  (
    { track, index = 1, id, style, className, frames = Infinity, children, ...props }: ViewProps,
    fref: React.ForwardedRef<THREE.Group>
  ) => {
    const rect = React.useRef<DOMRect>(null!)
    const { size, scene } = useThree()
    const [virtualScene] = React.useState(() => new THREE.Scene())

    const compute = React.useCallback(
      (event, state) => {
        if (rect.current && track.current && event.target === track.current) {
          const { width, height, left, top } = rect.current
          const x = event.clientX - left
          const y = event.clientY - top
          state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
          state.raycaster.setFromCamera(state.pointer, state.camera)
        }
      },
      [rect, track]
    )

    const [ready, toggle] = React.useReducer(() => true, false)
    React.useEffect(() => {
      // We need the tracking elements bounds beforehand in order to inject it into the portal
      rect.current = track.current?.getBoundingClientRect()
      // And now we can proceed
      toggle()
    }, [track])

    return (
      <group ref={fref} {...props}>
        {ready &&
          createPortal(
            <Container canvasSize={size} frames={frames} scene={scene} track={track} rect={rect} index={index}>
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

const HtmlView = React.forwardRef(
  (
    { as: El = 'div', id, className, style, index = 1, track, frames = Infinity, children, ...props }: ViewProps,
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
          <CanvasView key={uuid} track={ref} frames={frames} index={index}>
            {children}
          </CanvasView>
        </tracked.In>
      </>
    )
  }
)

type ViewType = { Port: () => React.ReactNode } & React.ForwardRefExoticComponent<
  ViewProps & React.RefAttributes<HTMLElement | THREE.Group>
>

export const View: ViewType = React.forwardRef(
  (props: ViewProps, fref: React.ForwardedRef<HTMLElement | THREE.Group>) => {
    // If we're inside a canvas we should be able to access the context store
    const store = React.useContext(context)
    // If that's not the case we render a tunnel
    if (!store) return <HtmlView ref={fref as unknown as React.ForwardedRef<HTMLElement>} {...props} />
    // Otherwise a plain canvas-view
    else return <CanvasView ref={fref as unknown as React.ForwardedRef<THREE.Group>} {...props} />
  }
) as ViewType

View.Port = () => <tracked.Out />

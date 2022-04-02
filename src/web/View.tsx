import * as React from 'react'
import * as THREE from 'three'
import { createPortal, useFrame, useThree } from '@react-three/fiber'

const isOrthographicCamera = (def: any): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera
const col = new THREE.Color()

export type ContainerProps = {
  scene: THREE.Scene
  index: number
  children?: React.ReactNode
  frames: number
  rect: React.MutableRefObject<DOMRect>
  track: React.MutableRefObject<HTMLElement>
}

export type ViewProps = {
  /** The tracking element, the view will be cut according to its whereabouts */
  track: React.MutableRefObject<HTMLElement>
  /** Views take over the render loop, optional render index (1 by default) */
  index?: number
  /** If you know your view is always at the same place set this to 1 to avoid needless getBoundingClientRect overhead */
  frames?: number
  /** The scene to render, if you leave this undefined it will render the default scene */
  children?: React.ReactNode
}

function Container({ scene, index, children, frames, rect, track }: ContainerProps) {
  const get = useThree((state) => state.get)
  const camera = useThree((state) => state.camera)
  const virtualScene = useThree((state) => state.scene)
  const setEvents = useThree((state) => state.setEvents)

  let frameCount = 0
  useFrame((state) => {
    if (frames === Infinity || frameCount <= frames) {
      rect.current = track.current?.getBoundingClientRect()
      frameCount++
    }

    if (rect.current) {
      const { left, right, top, bottom, width, height } = rect.current
      const isOffscreen = bottom < 0 || top > state.size.height || right < 0 || left > state.size.width
      const positiveYUpBottom = state.size.height - bottom
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

      state.gl.setViewport(left, positiveYUpBottom, width, height)
      state.gl.setScissor(left, positiveYUpBottom, width, height)
      state.gl.setScissorTest(true)

      if (isOffscreen) {
        state.gl.getClearColor(col)
        state.gl.setClearColor(col, state.gl.getClearAlpha())
        state.gl.clear(true, true)
        return
      }

      // When children are present render the portalled scene, otherwise the default scene
      state.gl.render(children ? virtualScene : scene, camera)
    }
  }, index)

  const [ready, toggle] = React.useReducer(() => true, false)
  React.useEffect(() => {
    const old = get().events.connected
    setEvents({ connected: track.current })
    toggle()
    return () => setEvents({ connected: old })
  }, [])

  return <>{ready && children}</>
}

export const View = ({ track, index = 1, frames = Infinity, children }: ViewProps) => {
  const rect = React.useRef<DOMRect>(null!)
  const scene = useThree((state) => state.scene)
  const [virtualScene] = React.useState(() => new THREE.Scene())

  const compute = React.useCallback(
    (event, state) => {
      if (track.current && event.target === track.current) {
        if (!rect.current) return
        const { width, height, left, top } = rect.current
        const x = event.clientX - left
        const y = event.clientY - top
        state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, state.camera)
      }
    },
    [rect]
  )

  return createPortal(
    <Container frames={frames} scene={scene} track={track} rect={rect} index={index}>
      {children}
    </Container>,
    virtualScene,
    { events: { compute, priority: index } }
  )
}

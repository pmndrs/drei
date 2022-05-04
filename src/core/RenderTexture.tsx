import * as THREE from 'three'
import * as React from 'react'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO } from './useFBO'

type Props = THREE.Texture & {
  /** Optional width of the texture, defaults to viewport bounds */
  width?: number
  /** Optional height of the texture, defaults to viewport bounds */
  height?: number
  /** Optional render priority, defaults to 0 */
  renderPriority?: number
  /** Optional event priority, defaults to 0 */
  eventPriority?: number
  /** Optional frame count, defaults to Infinity. If you set it to 1, it would only render a single frame, etc */
  frames?: number
  /** Children will be rendered into a portal */
  children: React.ReactNode
}

export const RenderTexture = React.forwardRef(
  (
    { children, width, height, renderPriority = 0, eventPriority = 0, frames = Infinity, ...props }: Props,
    forwardRef
  ) => {
    const { size, viewport } = useThree()
    const fbo = useFBO((width || size.width) * viewport.dpr, (height || size.height) * viewport.dpr, { samples: 8 })
    const [vScene] = React.useState(() => new THREE.Scene())

    const compute = React.useCallback((event, state, previous) => {
      // Since this is only a texture it does not have an easy way to obtain the parent, which we
      // need to transform event coordinates to local coordinates. We use r3f internals to find the
      // next Object3D.
      let parent = (fbo.texture as any)?.__r3f.parent
      while (parent && !(parent instanceof THREE.Object3D)) {
        parent = parent.__r3f.parent
      }
      if (!parent) return false
      if (!previous.raycaster.camera) previous.events.compute(event, previous, previous.previousRoot?.getState())
      const [intersection] = previous.raycaster.intersectObject(parent)
      if (!intersection) return false
      const uv = intersection.uv
      state.raycaster.setFromCamera(state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1), state.camera)
    }, [])

    React.useImperativeHandle(forwardRef, () => fbo.texture, [fbo])

    return (
      <>
        {createPortal(
          <Container renderPriority={renderPriority} frames={frames} fbo={fbo}>
            {children}
          </Container>,
          vScene,
          { events: { compute, priority: eventPriority } }
        )}
        <primitive object={fbo.texture} {...props} />
      </>
    )
  }
)

function Container({
  frames,
  renderPriority,
  children,
  fbo,
}: {
  frames: number
  renderPriority: number
  children: React.ReactNode
  fbo: THREE.WebGLRenderTarget
}) {
  let count = 0
  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      state.gl.setRenderTarget(fbo)
      state.gl.render(state.scene, state.camera)
      state.gl.setRenderTarget(null)
      count++
    }
  }, renderPriority)
  return <>{children}</>
}

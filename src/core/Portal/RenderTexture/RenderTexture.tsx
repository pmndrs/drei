//* RenderTexture - Platform-agnostic Render-to-Texture Component ==============================
// Renders children to a texture that can be used on other materials.
// Uses RenderTarget from #drei-platform for WebGL/WebGPU compatibility.
//
// NOTE: Uses double buffering (ping-pong) for WebGPU compatibility.
// WebGPU doesn't allow a texture to be written and read in the same command buffer submission.
//
// BUG WORKAROUND: We pass vScene explicitly because createPortal doesn't correctly set
// state.scene in useFrame. This is an R3F bug that should be reported.

import * as THREE from '#three'
import * as React from 'react'
import { createPortal, ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { RenderTarget } from '#drei-platform'

//* Types ==============================

export type RenderTextureProps = Omit<ThreeElements['texture'], 'ref' | 'args'> & {
  /** Optional width of the texture, defaults to viewport bounds */
  width?: number
  /** Optional height of the texture, defaults to viewport bounds */
  height?: number
  /** Optional fbo samples */
  samples?: number
  /** Optional stencil buffer, defaults to false */
  stencilBuffer?: boolean
  /** Optional depth buffer, defaults to true */
  depthBuffer?: boolean
  /** Optional generate mipmaps, defaults to false */
  generateMipmaps?: boolean
  /** Optional render priority, defaults to 0 */
  renderPriority?: number
  /** Optional event priority, defaults to 0 */
  eventPriority?: number
  /** Optional frame count, defaults to Infinity. If you set it to 1, it would only render a single frame, etc */
  frames?: number
  /** Optional event compute, defaults to undefined */
  compute?: (event: any, state: any, previous: any) => false | undefined
  /** Children will be rendered into a portal */
  children: React.ReactNode
}

//* RenderTexture Component ==============================

export const RenderTexture: ForwardRefComponent<RenderTextureProps, THREE.Texture> = /* @__PURE__ */ React.forwardRef(
  (
    {
      children,
      compute,
      width,
      height,
      samples = 4, // WebGPU only supports 1 and 4
      renderPriority = 0,
      eventPriority = 0,
      frames = Infinity,
      stencilBuffer = false,
      depthBuffer = true,
      generateMipmaps = false,
      ...props
    },
    forwardRef
  ) => {
    const { size, viewport, isLegacy } = useThree()
    const fboWidth = (width || size.width) * viewport.dpr
    const fboHeight = (height || size.height) * viewport.dpr

    // Double buffer FBOs for WebGPU compatibility
    const fboRef = React.useRef<{ a: InstanceType<typeof RenderTarget>; b: InstanceType<typeof RenderTarget> } | null>(
      null
    )

    if (!fboRef.current) {
      const settings = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: THREE.HalfFloatType,
        samples,
        stencilBuffer,
        depthBuffer,
        generateMipmaps,
      }
      fboRef.current = {
        a: new RenderTarget(fboWidth, fboHeight, settings),
        b: new RenderTarget(fboWidth, fboHeight, settings),
      }
    }

    const fboA = fboRef.current.a
    const fboB = fboRef.current.b

    // WebGPU textures need flipY = false (they're not flipped like WebGL)
    React.useLayoutEffect(() => {
      const needsFlip = !isLegacy
      ;(fboA.texture as THREE.Texture).flipY = !needsFlip
      ;(fboB.texture as THREE.Texture).flipY = !needsFlip
    }, [fboA, fboB, isLegacy])

    React.useLayoutEffect(() => {
      fboA.setSize(fboWidth, fboHeight)
      fboB.setSize(fboWidth, fboHeight)
    }, [fboA, fboB, fboWidth, fboHeight])

    React.useEffect(() => {
      return () => {
        if (fboRef.current) {
          fboRef.current.a.dispose()
          fboRef.current.b.dispose()
          fboRef.current = null
        }
      }
    }, [])

    // Track which buffer to display (0 = A, 1 = B)
    const readBufferIndex = React.useRef(0)
    const displayTextureRef = React.useRef<THREE.Texture>(fboA.texture as THREE.Texture)

    const [vScene] = React.useState(() => new THREE.Scene())

    const uvCompute = React.useCallback(
      (event: any, state: any, previous: any) => {
        let parent = (fboA.texture as any)?.__r3f?.parent?.object
        while (parent && !(parent instanceof THREE.Object3D)) {
          parent = parent.__r3f?.parent?.object
        }
        if (!parent) return false

        if (!previous.raycaster.camera) previous.events.compute(event, previous, previous.previousRoot?.getState())

        const [intersection] = previous.raycaster.intersectObject(parent)
        if (!intersection) return false

        const uv = intersection.uv
        if (!uv) return false
        state.raycaster.setFromCamera(state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1), state.camera)
      },
      [fboA]
    )

    React.useImperativeHandle(forwardRef, () => displayTextureRef.current, [])

    return (
      <>
        {createPortal(
          <Container
            renderPriority={renderPriority}
            frames={frames}
            fboA={fboA}
            fboB={fboB}
            readBufferIndex={readBufferIndex}
            displayTextureRef={displayTextureRef}
          >
            {children}
            <group onPointerOver={() => null} />
          </Container>,
          vScene,
          { events: { compute: compute || uvCompute, priority: eventPriority } }
        )}
        <primitive object={fboA.texture} {...props} />
      </>
    )
  }
)

//* Container Component ==============================
// Separated to ensure useFrame receives the portal's state, not the parent's state.
// NOTE: useThree() returns portal state correctly, useFrame does not (scheduler bug)

function Container({
  frames,
  renderPriority,
  children,
  fboA,
  fboB,
  readBufferIndex,
  displayTextureRef,
}: {
  frames: number
  renderPriority: number
  children: React.ReactNode
  fboA: InstanceType<typeof RenderTarget>
  fboB: InstanceType<typeof RenderTarget>
  readBufferIndex: React.MutableRefObject<number>
  displayTextureRef: React.MutableRefObject<THREE.Texture>
}) {
  // Get portal state from useThree (works correctly, unlike useFrame's state)
  const { scene: portalScene, camera: portalCamera, rootScene } = useThree()

  let count = 0
  let oldAutoClear: boolean
  let oldXrEnabled: boolean
  let oldRenderTarget: THREE.RenderTarget | null
  let oldIsPresenting: boolean

  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      // Double buffer: swap which FBO we read from vs write to
      const readFbo = readBufferIndex.current === 0 ? fboA : fboB
      const writeFbo = readBufferIndex.current === 0 ? fboB : fboA

      // Update display texture reference
      displayTextureRef.current = readFbo.texture as THREE.Texture

      // Save state
      oldAutoClear = state.renderer.autoClear
      oldXrEnabled = state.renderer.xr.enabled
      oldRenderTarget = state.renderer.getRenderTarget()
      oldIsPresenting = state.renderer.xr.isPresenting

      // Render portal scene to write buffer
      // Using portalScene/portalCamera from useThree (useFrame state has scheduler bug)
      state.renderer.autoClear = true
      state.renderer.xr.enabled = false
      state.renderer.xr.isPresenting = false
      state.renderer.setRenderTarget(writeFbo as THREE.WebGLRenderTarget)
      state.renderer.render(portalScene, portalCamera)
      state.renderer.setRenderTarget(oldRenderTarget as THREE.WebGLRenderTarget | null)

      // Restore state
      state.renderer.autoClear = oldAutoClear
      state.renderer.xr.enabled = oldXrEnabled
      state.renderer.xr.isPresenting = oldIsPresenting

      // Swap buffers for next frame
      readBufferIndex.current = readBufferIndex.current === 0 ? 1 : 0

      count++
    }
  }, renderPriority)

  return <>{children}</>
}

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
import {
  attach as attachTexture,
  createPortal,
  detach as detachTexture,
  resolve,
  ThreeElements,
} from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
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

type TextureAttachment = {
  parent: Parameters<typeof attachTexture>[0]
  child: Parameters<typeof attachTexture>[1]
}

const noAttach = () => () => {}

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
      attach,
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
    const attachmentRef = React.useRef<TextureAttachment | null>(null)
    const forwardedTextureRef = React.useRef<THREE.Texture | null>(null)
    const refCleanup = React.useRef<(() => void) | null>(null)

    const updateRef = React.useCallback(
      (texture: THREE.Texture | null) => {
        if (forwardedTextureRef.current === texture) return
        const previous = forwardedTextureRef.current
        forwardedTextureRef.current = texture

        if (typeof forwardRef === 'function') {
          if (refCleanup.current) {
            const cleanup = refCleanup.current
            refCleanup.current = null
            cleanup()
          } else if (previous) {
            forwardRef(null)
          }
          if (texture) {
            const cleanup = (forwardRef as React.RefCallback<THREE.Texture>)(texture)
            if (typeof cleanup === 'function') refCleanup.current = cleanup
          }
        } else if (forwardRef) {
          forwardRef.current = texture
        }
      },
      [forwardRef]
    )

    const customAttach = React.useCallback(
      (parent: unknown) => {
        // Keep attachment bookkeeping separate from the reconciler-owned primitive.
        const attachment: TextureAttachment = {
          parent: { object: parent } as TextureAttachment['parent'],
          child: {
            object: displayTextureRef.current,
            props: { attach },
          } as TextureAttachment['child'],
        }
        attachTexture(attachment.parent, attachment.child)
        attachmentRef.current = attachment

        return () => {
          if (attachmentRef.current === attachment) attachmentRef.current = null
          detachTexture(attachment.parent, attachment.child)
        }
      },
      [attach]
    )

    const publishTexture = React.useCallback(
      (texture: THREE.Texture) => {
        displayTextureRef.current = texture
        const attachment = attachmentRef.current
        if (attachment && attachment.child.object !== texture) {
          const target = attachment.child.props.attach
          if (typeof target === 'string') {
            // Preserve previousAttach for unmount without recompiling the material every frame.
            const { root, key } = resolve(attachment.parent.object, target)
            root[key] = texture
            attachment.child.object = texture
          } else {
            detachTexture(attachment.parent, attachment.child)
            attachment.child.object = texture
            attachTexture(attachment.parent, attachment.child)
          }
        }
        updateRef(texture)
      },
      [updateRef]
    )

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

    React.useLayoutEffect(() => {
      updateRef(displayTextureRef.current)
      return () => updateRef(null)
    }, [updateRef])

    return (
      <>
        {createPortal(
          <Container
            renderPriority={renderPriority}
            frames={frames}
            fboA={fboA}
            fboB={fboB}
            readBufferIndex={readBufferIndex}
            publishTexture={publishTexture}
          >
            {children}
            <group onPointerOver={() => null} />
          </Container>,
          vScene,
          { events: { compute: compute || uvCompute, priority: eventPriority } }
        )}
        {/* Apply declarative texture props to both buffers; only one owns the parent attachment. */}
        {React.createElement('primitive', { object: fboA.texture, ...props, attach: customAttach })}
        {React.createElement('primitive', { object: fboB.texture, ...props, attach: noAttach })}
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
  publishTexture,
}: {
  frames: number
  renderPriority: number
  children: React.ReactNode
  fboA: InstanceType<typeof RenderTarget>
  fboB: InstanceType<typeof RenderTarget>
  readBufferIndex: React.MutableRefObject<number>
  publishTexture: (texture: THREE.Texture) => void
}) {
  // Get portal state from useThree (works correctly, unlike useFrame's state)
  const { scene: portalScene, camera: portalCamera } = useThree()

  const count = React.useRef(0)

  useFrame(
    (state) => {
      if (frames === Infinity || count.current < frames) {
        // Double buffer: swap which FBO we read from vs write to
        const writeFbo = readBufferIndex.current === 0 ? fboB : fboA

        // Save state
        const oldAutoClear = state.renderer.autoClear
        const oldXrEnabled = state.renderer.xr.enabled
        const oldRenderTarget = state.renderer.getRenderTarget()
        const oldCubeFace = state.renderer.getActiveCubeFace()
        const oldMipmapLevel = state.renderer.getActiveMipmapLevel()
        const oldIsPresenting = state.renderer.xr.isPresenting

        // Render portal scene to write buffer
        // Using portalScene/portalCamera from useThree (useFrame state has scheduler bug)
        try {
          state.renderer.autoClear = true
          state.renderer.xr.enabled = false
          // Both renderer builds expose a writable XR field despite the readonly type.
          ;(state.renderer.xr as { isPresenting: boolean }).isPresenting = false
          state.renderer.setRenderTarget(writeFbo as THREE.WebGLRenderTarget)
          state.renderer.render(portalScene, portalCamera)
        } finally {
          state.renderer.setRenderTarget(oldRenderTarget as THREE.WebGLRenderTarget | null, oldCubeFace, oldMipmapLevel)
          state.renderer.autoClear = oldAutoClear
          state.renderer.xr.enabled = oldXrEnabled
          ;(state.renderer.xr as { isPresenting: boolean }).isPresenting = oldIsPresenting
        }

        // Swap buffers for next frame
        readBufferIndex.current = readBufferIndex.current === 0 ? 1 : 0

        count.current++
        publishTexture(writeFbo.texture as THREE.Texture)
      }
    },
    { phase: renderPriority > 0 ? 'render' : 'update', priority: -renderPriority }
  )

  return <>{children}</>
}

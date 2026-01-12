//* RenderCubeTexture - Cube Render-to-Texture Component ==============================
// Renders children to a cube texture for environment maps.
// Contents run in a portal - isolated scene with own events/environment.
//
// NOTE: Uses double buffering (ping-pong) for WebGPU compatibility.
// WebGPU doesn't allow a texture to be written and read in the same command buffer submission.
//
// BUG WORKAROUND: We get portalScene from useThree() because createPortal doesn't
// correctly set state.scene in useFrame. This is an R3F bug that should be reported.

import * as THREE from '#three'
import * as React from 'react'
import { ComputeFunction, ReactThreeFiber, ThreeElements, createPortal, useFrame, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type RenderCubeTextureProps = Omit<ThreeElements['texture'], 'ref' | 'args' | 'rotation'> & {
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
  compute?: ComputeFunction
  /** Flip cubemap, see https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLCubeRenderTarget.js */
  flip?: boolean
  /** Cubemap resolution (for each of the 6 takes), null === full screen resolution, default: 896 */
  resolution?: number
  /** Children will be rendered into a portal */
  children: React.ReactNode
  near?: number
  far?: number
  position?: ReactThreeFiber.Vector3
  rotation?: ReactThreeFiber.Euler
  scale?: ReactThreeFiber.Vector3
  quaternion?: ReactThreeFiber.Quaternion
  matrix?: ReactThreeFiber.Matrix4
  matrixAutoUpdate?: boolean
}

type CubeRenderTargetPair = {
  a: THREE.WebGLCubeRenderTarget
  b: THREE.WebGLCubeRenderTarget
}

export type RenderCubeTextureApi = {
  scene: THREE.Scene
  /** The currently active (read) FBO */
  fbo: THREE.WebGLCubeRenderTarget
  /** The cube camera */
  camera: THREE.CubeCamera
}

//* RenderCubeTexture Component ==============================

/**
 * Renders children to a cube texture for environment maps.
 * Contents run in a portal - isolated scene with own events/environment.
 *
 * @example Dynamic environment map
 * ```jsx
 * <mesh>
 *   <sphereGeometry />
 *   <meshBasicMaterial>
 *     <RenderCubeTexture attach="envMap" flip>
 *       <mesh><boxGeometry /></mesh>
 *     </RenderCubeTexture>
 *   </meshBasicMaterial>
 * </mesh>
 * ```
 */
export const RenderCubeTexture: ForwardRefComponent<RenderCubeTextureProps, RenderCubeTextureApi> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        children,
        compute,
        renderPriority = -1,
        eventPriority = 0,
        frames = Infinity,
        stencilBuffer = false,
        depthBuffer = true,
        generateMipmaps = false,
        resolution = 896,
        near = 0.1,
        far = 1000,
        flip = false,
        position,
        rotation,
        scale,
        quaternion,
        matrix,
        matrixAutoUpdate,
        ...props
      },
      forwardRef
    ) => {
      const { size, viewport } = useThree()
      const fboSize = Math.max((resolution || size.width) * viewport.dpr, (resolution || size.height) * viewport.dpr)

      // Double buffer FBOs for WebGPU compatibility (single camera, swap render targets)
      const fboRef = React.useRef<CubeRenderTargetPair | null>(null)
      const cameraRef = React.useRef<THREE.CubeCamera | null>(null)

      if (!fboRef.current) {
        const settings = {
          stencilBuffer,
          depthBuffer,
          generateMipmaps,
        }

        const fboA = new THREE.WebGLCubeRenderTarget(fboSize, settings)
        fboA.texture.isRenderTargetTexture = !flip
        fboA.texture.flipY = true
        fboA.texture.type = THREE.HalfFloatType

        const fboB = new THREE.WebGLCubeRenderTarget(fboSize, settings)
        fboB.texture.isRenderTargetTexture = !flip
        fboB.texture.flipY = true
        fboB.texture.type = THREE.HalfFloatType

        fboRef.current = { a: fboA, b: fboB }
      }

      // Single camera - we swap renderTarget each frame
      if (!cameraRef.current && fboRef.current) {
        cameraRef.current = new THREE.CubeCamera(near, far, fboRef.current.a)
      }

      const fboA = fboRef.current!.a
      const fboB = fboRef.current!.b
      const camera = cameraRef.current!

      // Track which buffer to display (0 = A, 1 = B)
      const readBufferIndex = React.useRef(0)
      const displayTextureRef = React.useRef<THREE.CubeTexture>(fboA.texture)

      // Keep camera in sync with position/rotation props
      React.useLayoutEffect(() => {
        if (position) {
          if (Array.isArray(position)) camera.position.set(...(position as [number, number, number]))
          else if (position instanceof THREE.Vector3) camera.position.copy(position)
        }
        if (rotation) {
          if (Array.isArray(rotation)) camera.rotation.set(...(rotation as [number, number, number]))
          else if (rotation instanceof THREE.Euler) camera.rotation.copy(rotation)
        }
        if (scale) {
          if (Array.isArray(scale)) camera.scale.set(...(scale as [number, number, number]))
          else if (scale instanceof THREE.Vector3) camera.scale.copy(scale)
        }
        if (quaternion) {
          if (quaternion instanceof THREE.Quaternion) camera.quaternion.copy(quaternion)
        }
        if (matrix) {
          if (matrix instanceof THREE.Matrix4) camera.matrix.copy(matrix)
        }
        if (matrixAutoUpdate !== undefined) camera.matrixAutoUpdate = matrixAutoUpdate
      }, [camera, position, rotation, scale, quaternion, matrix, matrixAutoUpdate])

      React.useEffect(() => {
        return () => {
          if (fboRef.current) {
            fboRef.current.a.dispose()
            fboRef.current.b.dispose()
            fboRef.current = null
          }
          cameraRef.current = null
        }
      }, [])

      const [vScene] = React.useState(() => new THREE.Scene())

      // Expose the currently active (read) FBO and the single camera
      React.useImperativeHandle(
        forwardRef,
        () => ({
          scene: vScene,
          get fbo() {
            return readBufferIndex.current === 0 ? fboA : fboB
          },
          camera,
        }),
        [vScene, fboA, fboB, camera]
      )

      return (
        <>
          {createPortal(
            <Container
              renderPriority={renderPriority}
              frames={frames}
              camera={camera}
              fboA={fboA}
              fboB={fboB}
              readBufferIndex={readBufferIndex}
              displayTextureRef={displayTextureRef}
            >
              {children}
              {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
              <group onPointerOver={() => null} />
            </Container>,
            vScene,
            { events: { compute, priority: eventPriority } }
          )}
          <DynamicTexture
            displayTextureRef={displayTextureRef}
            fboA={fboA}
            fboB={fboB}
            readBufferIndex={readBufferIndex}
            {...props}
          />
        </>
      )
    }
  )

//* DynamicTexture Component ==============================
// Handles dynamic texture swapping for double buffering.
// Uses R3F's attach callback to capture parent material, then updates texture each frame.

function DynamicTexture({
  displayTextureRef,
  fboA,
  fboB,
  readBufferIndex,
  ...props
}: {
  displayTextureRef: React.MutableRefObject<THREE.CubeTexture>
  fboA: THREE.WebGLCubeRenderTarget
  fboB: THREE.WebGLCubeRenderTarget
  readBufferIndex: React.MutableRefObject<number>
} & Omit<ThreeElements['texture'], 'ref' | 'args'>) {
  const materialRef = React.useRef<THREE.Material | null>(null)
  const attachKey = typeof (props as any).attach === 'string' ? (props as any).attach : 'envMap'

  // Custom attach callback to capture the parent material reference
  // R3F's attach callback receives the actual parent object (the material in this case)
  const customAttach = React.useCallback(
    (parent: any, self: THREE.CubeTexture) => {
      // parent should be the material (meshBasicMaterial in Fisheye's case)
      // R3F may pass the actual Three.js object or an internal wrapper
      const material = parent?.isMaterial ? parent : parent?.object
      if (!material) {
        console.warn('RenderCubeTexture: Could not find parent material for attach')
        return () => {}
      }

      materialRef.current = material
      if (attachKey in material) {
        material[attachKey] = self
        material.needsUpdate = true
      }
      return () => {
        if (materialRef.current && attachKey in materialRef.current) {
          ;(materialRef.current as any)[attachKey] = null
          materialRef.current.needsUpdate = true
        }
        materialRef.current = null
      }
    },
    [attachKey]
  )

  // Update texture on the material each frame BEFORE the Fisheye render
  // Use priority -0.5 to run after Container (-1) but before default (0) and Fisheye's render
  useFrame(() => {
    if (!materialRef.current) return

    // Get the current read texture (the one NOT being rendered to)
    const readTexture = displayTextureRef.current

    // Update material's texture
    if (attachKey in materialRef.current) {
      ;(materialRef.current as any)[attachKey] = readTexture
    }
  }, -0.5)

  // Initial mount uses fboA texture
  return <primitive object={fboA.texture} attach={customAttach} />
}

//* Container Component ==============================
// Separated to ensure useFrame receives the portal's state, not the parent's state.
// NOTE: useThree() returns portal state correctly, useFrame does not (scheduler bug)

function Container({
  frames,
  renderPriority,
  children,
  camera,
  fboA,
  fboB,
  readBufferIndex,
  displayTextureRef,
}: {
  frames: number
  renderPriority: number
  children: React.ReactNode
  camera: THREE.CubeCamera
  fboA: THREE.WebGLCubeRenderTarget
  fboB: THREE.WebGLCubeRenderTarget
  readBufferIndex: React.MutableRefObject<number>
  displayTextureRef: React.MutableRefObject<THREE.CubeTexture>
}) {
  // Get portal state from useThree (works correctly, unlike useFrame's state)
  const { scene: portalScene } = useThree()

  let count = 0
  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      // Double buffer: determine read/write FBOs
      const readFbo = readBufferIndex.current === 0 ? fboA : fboB
      const writeFbo = readBufferIndex.current === 0 ? fboB : fboA

      // Update display texture reference (read from previous frame's render)
      displayTextureRef.current = readFbo.texture

      // Swap camera's render target to the write buffer
      // CubeCamera internally uses this.renderTarget for its 6 face renders
      ;(camera as any).renderTarget = writeFbo

      // Render to write buffer using portalScene from useThree (useFrame state has scheduler bug)
      camera.update(state.gl, portalScene)

      // Swap buffers for next frame
      readBufferIndex.current = readBufferIndex.current === 0 ? 1 : 0

      count++
    }
  }, renderPriority)

  return <>{children}</>
}

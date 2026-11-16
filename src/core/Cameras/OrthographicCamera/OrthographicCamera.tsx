import * as THREE from '#three'
import * as React from 'react'
import { OrthographicCamera as OrthographicCameraImpl } from '#three'
import { ThreeElements } from '@react-three/fiber'
import { useThree, useFrame } from '@react-three/fiber/extension'
import { useFBO } from '@core/Portal/Fbo'
import { ForwardRefComponent } from '../../../utils/ts-utils'

const isFunction = (node: any): node is Function => typeof node === 'function'

export type OrthographicCameraProps = Omit<ThreeElements['orthographicCamera'], 'ref' | 'children'> & {
  /** Registers the camera as the system default, fiber will start rendering with it */
  makeDefault?: boolean
  /** Making it manual will stop responsiveness and you have to calculate aspect ratio yourself. */
  manual?: boolean
  /** The contents will either follow the camera, or be hidden when filming if you pass a function */
  children?: React.ReactNode | ((texture: THREE.Texture) => React.ReactNode)
  /** Number of frames to render, Infinity */
  frames?: number
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Optional environment map for functional use */
  envMap?: THREE.Texture
}

/**
 * A responsive THREE.OrthographicCamera that can set itself as the default.
 * Same API as PerspectiveCamera, including render-to-texture capability.
 *
 * @example Set as default camera
 * ```jsx
 * <OrthographicCamera makeDefault position={[0, 0, 10]} />
 * ```
 *
 * @example Film into texture
 * ```jsx
 * <OrthographicCamera position={[0, 0, 10]}>
 *   {(texture) => (
 *     <mesh>
 *       <meshBasicMaterial map={texture} />
 *     </mesh>
 *   )}
 * </OrthographicCamera>
 * ```
 */
export const OrthographicCamera: ForwardRefComponent<OrthographicCameraProps, OrthographicCameraImpl> =
  /* @__PURE__ */ React.forwardRef(
    ({ envMap, resolution = 256, frames = Infinity, children, makeDefault, ...props }, ref) => {
      const set = useThree(({ set }) => set)
      const camera = useThree(({ camera }) => camera)
      const size = useThree(({ size }) => size)
      const cameraRef = React.useRef<OrthographicCameraImpl>(null!)
      React.useImperativeHandle(ref, () => cameraRef.current, [])
      const groupRef = React.useRef<THREE.Group>(null!)
      const fbo = useFBO(resolution)

      React.useLayoutEffect(() => {
        if (!props.manual) {
          cameraRef.current.updateProjectionMatrix()
        }
      }, [size, props])

      React.useLayoutEffect(() => {
        cameraRef.current.updateProjectionMatrix()
      })

      React.useLayoutEffect(() => {
        if (makeDefault) {
          const oldCam = camera
          set(() => ({ camera: cameraRef.current! }))
          return () => set(() => ({ camera: oldCam }))
        }
        // The camera should not be part of the dependency list because this components camera is a stable reference
        // that must exchange the default, and clean up after itself on unmount.
      }, [cameraRef, makeDefault, set])

      // A ref, not a body-level `let`: a re-render must not reset the count, or `frames={1}`
      // would film again every time the parent re-renders (same as CubeCamera).
      const countRef = React.useRef(0)
      let oldEnvMap: THREE.Color | THREE.Texture | null = null
      let oldRenderTarget: THREE.RenderTarget | null = null
      const functional = isFunction(children)
      useFrame((state) => {
        if (functional && (frames === Infinity || countRef.current < frames)) {
          const { renderer } = state
          groupRef.current.visible = false
          // Save whatever is bound right now (View, RenderTexture, Hud, a post-processing
          // pass) rather than assuming the canvas, so the restore hands it back untouched.
          oldRenderTarget = renderer.getRenderTarget()
          oldEnvMap = state.scene.background
          if (envMap) state.scene.background = envMap
          // R3FRenderer is WebGLRenderer | WebGPURenderer, so the union's setRenderTarget
          // only accepts WebGLRenderTarget, while useFBO (a WebGPU RenderTarget in the WebGPU
          // build) and getRenderTarget() give the wider RenderTarget. The casts are type-only.
          renderer.setRenderTarget(fbo as THREE.WebGLRenderTarget)
          renderer.render(state.scene, cameraRef.current)
          renderer.setRenderTarget(oldRenderTarget as THREE.WebGLRenderTarget | null)
          state.scene.background = oldEnvMap
          groupRef.current.visible = true
          countRef.current++
        }
      })

      return (
        <>
          <orthographicCamera
            left={size.width / -2}
            right={size.width / 2}
            top={size.height / 2}
            bottom={size.height / -2}
            ref={cameraRef}
            {...props}
          >
            {!functional && children}
          </orthographicCamera>
          <group ref={groupRef}>{functional && children(fbo.texture)}</group>
        </>
      )
    }
  )

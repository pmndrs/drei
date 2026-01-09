//* CubeCamera ==============================
// Platform-agnostic CubeCamera implementation using #drei-platform for render target

import * as React from 'react'
import { useEffect, useMemo, useCallback, useRef } from 'react'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { CubeCamera as ThreeCubeCamera, HalfFloatType, Fog, FogExp2, Texture, Group } from '#three'
import { CubeRenderTarget } from '#drei-platform'

/**
 * Options for configuring the CubeCamera.
 */
export type CubeCameraOptions = {
  /**
   * Resolution of the cube render target (FBO).
   * @default 256
   */
  resolution?: number
  /**
   * Near clipping plane for the camera.
   * @default 0.1
   */
  near?: number
  /**
   * Far clipping plane for the camera.
   * @default 1000
   */
  far?: number
  /**
   * Custom environment map that is temporarily set as the scene's background while rendering the cube.
   */
  envMap?: Texture
  /**
   * Custom fog that is temporarily set as the scene's fog while rendering the cube.
   */
  fog?: Fog | FogExp2
}

/**
 * Props for the CubeCamera component.
 */
export type CubeCameraProps = Omit<ThreeElements['group'], 'children'> & {
  /**
   * Render-prop function that receives the generated cube texture.
   * The contents of CubeCamera will be hidden when filming the cube to avoid self-reflection.
   */
  children?: (tex: Texture) => React.ReactNode
  /**
   * Number of frames to render.
   * If set to Infinity, updates continuously. Lower values allow for static reflections.
   * @default Infinity
   */
  frames?: number
} & CubeCameraOptions

/**
 * React hook to manage allocation and lifecycle of a THREE.CubeCamera with a platform-agnostic cube render target.
 *
 * @param options - Configuration options for the cube camera.
 * @returns Object containing the cube render target (`fbo`), cube camera (`camera`), and an update function (`update`) to render the environment to the cube map.
 */
export function useCubeCamera({ resolution = 256, near = 0.1, far = 1000, envMap, fog }: CubeCameraOptions = {}) {
  const gl = useThree(({ gl }) => gl)
  const scene = useThree(({ scene }) => scene)

  /**
   * Create cube render target (6-face cube map, can't use useFBO which is 2D)
   */
  const fbo = useMemo(() => {
    const fbo = new CubeRenderTarget(resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])

  /**
   * Dispose the FBO on unmount to clean up memory.
   */
  useEffect(() => {
    return () => fbo.dispose()
  }, [fbo])

  /**
   * Create the underlying Three.js CubeCamera instance.
   */
  const camera = useMemo(() => new ThreeCubeCamera(near, far, fbo), [near, far, fbo])

  /**
   * Updates the cube camera by temporarily swapping in environment map/fog,
   * rendering, and then restoring the originals.
   */
  const update = useCallback(() => {
    const originalFog = scene.fog
    const originalBackground = scene.background

    scene.background = envMap || originalBackground
    scene.fog = fog || originalFog

    camera.update(gl, scene)

    scene.fog = originalFog
    scene.background = originalBackground
  }, [gl, scene, camera, envMap, fog])

  return { fbo, camera, update }
}

/**
 * A THREE.CubeCamera that returns its texture as a render-prop.
 * Renders its children with a reflective cubemap environment and supports dynamic or static updating.
 * The `children` are temporarily hidden when rendering the cubemap to avoid self-reflection artifacts.
 *
 * @param props - {@link CubeCameraProps}
 * @returns React element with cubemap reflection support.
 *
 * @example
 * // Basic reflective sphere
 * <CubeCamera>
 *   {(texture) => (
 *     <mesh>
 *       <sphereGeometry />
 *       <meshStandardMaterial envMap={texture} />
 *     </mesh>
 *   )}
 * </CubeCamera>
 *
 * @example
 * // Static reflection (2 frames for objects to see each other)
 * <CubeCamera frames={2} resolution={256}>
 *   {(texture) => <mesh><meshStandardMaterial envMap={texture} /></mesh>}
 * </CubeCamera>
 */
export function CubeCamera({
  children,
  frames = Infinity,
  resolution,
  near,
  far,
  envMap,
  fog,
  ...props
}: CubeCameraProps) {
  const ref = useRef<Group>(null!)
  const { fbo, camera, update } = useCubeCamera({ resolution, near, far, envMap, fog })

  /**
   * Track frame count to determine when to stop updating the cubemap for static reflections.
   */
  const countRef = useRef(0)

  useFrame(() => {
    if (ref.current && (frames === Infinity || countRef.current < frames)) {
      ref.current.visible = false
      update()
      ref.current.visible = true
      countRef.current++
    }
  })

  return (
    <group {...props}>
      <primitive object={camera} />
      <group ref={ref}>{children?.(fbo.texture)}</group>
    </group>
  )
}

//* CubeCamera ==============================
// Platform-agnostic CubeCamera implementation using #drei-platform for render target

import * as React from 'react'
import { useEffect, useMemo, useCallback, useRef } from 'react'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { CubeCamera as ThreeCubeCamera, HalfFloatType, Fog, FogExp2, Texture, Group } from '#three'
import { CubeRenderTarget } from '#drei-platform'

//* Types ==============================

export type CubeCameraOptions = {
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Camera near, 0.1 */
  near?: number
  /** Camera far, 1000 */
  far?: number
  /** Custom environment map that is temporarily set as the scenes background */
  envMap?: Texture
  /** Custom fog that is temporarily set as the scenes fog */
  fog?: Fog | FogExp2
}

export type CubeCameraProps = Omit<ThreeElements['group'], 'children'> & {
  /** The contents of CubeCamera will be hidden when filming the cube */
  children?: (tex: Texture) => React.ReactNode
  /** Number of frames to render, Infinity */
  frames?: number
} & CubeCameraOptions

//* useCubeCamera Hook ==============================

export function useCubeCamera({ resolution = 256, near = 0.1, far = 1000, envMap, fog }: CubeCameraOptions = {}) {
  const gl = useThree(({ gl }) => gl)
  const scene = useThree(({ scene }) => scene)

  // Create cube render target (6-face cube map, can't use useFBO which is 2D)
  const fbo = useMemo(() => {
    const fbo = new CubeRenderTarget(resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])

  // Cleanup on unmount
  useEffect(() => {
    return () => fbo.dispose()
  }, [fbo])

  // Create cube camera
  const camera = useMemo(() => new ThreeCubeCamera(near, far, fbo), [near, far, fbo])

  // Update function - temporarily swaps scene background/fog while rendering
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

//* CubeCamera Component ==============================

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

  // Track frame count with ref to persist across renders
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

import * as THREE from 'three'
import { HalfFloatType, Fog, FogExp2, WebGLCubeRenderTarget } from 'three'
import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'

export type CubeCameraOptions = {
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Camera near, 0.1 */
  near?: number
  /** Camera far, 1000 */
  far?: number
  /** Custom environment map that is temporarily set as the scenes background */
  envMap?: THREE.Texture
  /** Custom fog that is temporarily set as the scenes fog */
  fog?: Fog | FogExp2
}

export function useCubeCamera({ resolution = 256, near = 0.1, far = 1000, envMap, fog }: CubeCameraOptions = {}) {
  const gl = useThree(({ gl }) => gl)
  const scene = useThree(({ scene }) => scene)

  const fbo = useMemo(() => {
    const fbo = new WebGLCubeRenderTarget(resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])

  useEffect(() => {
    return () => {
      fbo.dispose()
    }
  }, [fbo])

  const camera = useMemo(() => new THREE.CubeCamera(near, far, fbo), [near, far, fbo])

  let originalFog
  let originalBackground
  const update = React.useCallback(() => {
    originalFog = scene.fog
    originalBackground = scene.background
    scene.background = envMap || originalBackground
    scene.fog = fog || originalFog
    camera.update(gl, scene)
    scene.fog = originalFog
    scene.background = originalBackground
  }, [gl, scene, camera])

  return {
    fbo,
    camera,
    update,
  }
}

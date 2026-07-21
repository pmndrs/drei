import { Object3D, Camera, WebGLCubeRenderTarget, CubeCamera, Scene } from 'three'
import * as React from 'react'
import { useThree } from '@react-three/fiber'

export type PreloadProps = {
  all?: boolean
  scene?: Object3D
  camera?: Camera
  /** Called once shader compilation has finished */
  onComplete?: () => void
}

export function Preload({ all, scene, camera, onComplete }: PreloadProps) {
  const gl = useThree(({ gl }) => gl)
  const dCamera = useThree(({ camera }) => camera)
  const dScene = useThree(({ scene }) => scene)

  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  // Layout effect because it must run before React commits
  React.useLayoutEffect(() => {
    const invisible: Object3D[] = []
    const culled: Object3D[] = []
    if (all) {
      // Find all invisible and frustum-culled objects, store and then flip them —
      // both are skipped by the renderer, so they would never be compiled
      ;(scene || dScene).traverse((object) => {
        if (object.visible === false) {
          invisible.push(object)
          object.visible = true
        }
        if (object.frustumCulled) {
          culled.push(object)
          object.frustumCulled = false
        }
      })
    }
    // Now compile the scene. compileAsync (r152+) is the recommended path: in
    // WebGL it uses KHR_parallel_shader_compile and actually warms the programs,
    // where the sync compile() no longer does; in WebGPU compile() is just an
    // alias for it anyway.
    gl.compileAsync(scene || dScene, camera || dCamera).then(() => {
      // And for good measure, hit it with a cube camera
      const cubeRenderTarget = new WebGLCubeRenderTarget(128)
      const cubeCamera = new CubeCamera(0.01, 100000, cubeRenderTarget)
      cubeCamera.update(gl, (scene || dScene) as Scene)
      cubeRenderTarget.dispose()
      // Flip these objects back once compilation is done
      invisible.forEach((object) => (object.visible = false))
      culled.forEach((object) => (object.frustumCulled = true))
      onCompleteRef.current?.()
    })
  }, [])
  return null
}

import { Object3D, Camera, WebGLCubeRenderTarget, CubeCamera, Scene } from 'three'
import * as React from 'react'
import { useThree } from '@react-three/fiber'

export type PreloadProps = {
  all?: boolean
  scene?: Object3D
  camera?: Camera
  onDone?: () => void
}

export function Preload({ all, scene, camera, onDone }: PreloadProps) {
  const gl = useThree(({ gl }) => gl)
  const dCamera = useThree(({ camera }) => camera)
  const dScene = useThree(({ scene }) => scene)

  // Layout effect because it must run before React commits
  React.useLayoutEffect(() => {
    let disposed = false
    const activeScene = scene || dScene
    const activeCamera = camera || dCamera
    const invisible: Object3D[] = []
    const culled: Object3D[] = []
    const restore = () => {
      // Flips these objects back
      invisible.forEach((object) => (object.visible = false))
      culled.forEach((object) => (object.frustumCulled = true))
    }

    if (all) {
      // Find all invisible or culled objects, store and then flip them
      activeScene.traverse((object) => {
        if (object.visible === false) {
          invisible.push(object)
          object.visible = true
        }
        if (object.frustumCulled === true) {
          culled.push(object)
          object.frustumCulled = false
        }
      })
    }

    const preload = async () => {
      let completed = false
      try {
        // Now compile the scene
        await gl.compileAsync(activeScene, activeCamera)
        if (disposed) return
        // And for good measure, hit it with a cube camera
        const cubeRenderTarget = new WebGLCubeRenderTarget(128)
        const cubeCamera = new CubeCamera(0.01, 100000, cubeRenderTarget)
        cubeCamera.update(gl, activeScene as Scene)
        cubeRenderTarget.dispose()
        completed = true
      } finally {
        restore()
      }
      if (completed && !disposed) onDone?.()
    }

    void preload()

    return () => {
      disposed = true
      restore()
    }
  }, [])
  return null
}

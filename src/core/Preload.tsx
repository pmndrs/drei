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
    const invisible: Object3D[] = []
    const culled: Object3D[] = []
    const activeScene = scene || dScene
    const activeCamera = camera || dCamera
    let disposed = false

    if (all) {
      // Find all objects that would be skipped by render traversal, then restore them after preloading.
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

    let compile: Promise<unknown> = Promise.resolve()
    try {
      // Now compile the scene
      compile = gl.compileAsync
        ? gl.compileAsync(activeScene, activeCamera)
        : Promise.resolve(gl.compile(activeScene, activeCamera))
      // And for good measure, hit it with a cube camera
      const cubeRenderTarget = new WebGLCubeRenderTarget(128)
      const cubeCamera = new CubeCamera(0.01, 100000, cubeRenderTarget)
      cubeCamera.update(gl, activeScene as Scene)
      cubeRenderTarget.dispose()
    } finally {
      // Flips these objects back
      invisible.forEach((object) => (object.visible = false))
      culled.forEach((object) => (object.frustumCulled = true))
    }

    Promise.resolve(compile).then(() => {
      if (!disposed) onDone?.()
    })

    return () => {
      disposed = true
    }
  }, [])
  return null
}

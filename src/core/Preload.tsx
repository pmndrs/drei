import { Object3D, Camera } from 'three'
import * as React from 'react'
import { useThree } from '@react-three/fiber'

type Props = {
  all?: boolean
  scene?: Object3D
  camera?: Camera
}

export function Preload({ all, scene, camera }: Props) {
  const gl = useThree(({ gl }) => gl)
  const dCamera = useThree(({ camera }) => camera)
  const dScene = useThree(({ scene }) => scene)

  // Layout effect because it must run before React commits
  React.useLayoutEffect(() => {
    const invisible: Object3D[] = []
    if (all) {
      // Find all invisible objects, store and then flip them
      ;(scene || dScene).traverse((object) => {
        if (object.visible === false) {
          invisible.push(object)
          object.visible = true
        }
      })
    }
    // Now compile the scene
    gl.compile(scene || dScene, camera || dCamera)
    // Flips these objects back
    invisible.forEach((object) => (object.visible = false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

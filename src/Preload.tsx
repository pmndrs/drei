import { Object3D } from 'three'
import * as React from 'react'
import { useThree } from 'react-three-fiber'

export function Preload({ all }) {
  const { gl, scene, camera } = useThree()
  // Layout effect because it must run before React commits
  React.useLayoutEffect(() => {
    const invisible: Object3D[] = []
    if (all) {
      // Find all invisible objects, store and then flip them
      scene.traverse((object) => {
        if (object.visible === false) {
          invisible.push(object)
          object.visible = true
        }
      })
    }
    // Now compile the scene
    gl.compile(scene, camera)
    // Flips these objects back
    invisible.forEach((object) => (object.visible = false))
  }, [])
  return null
}

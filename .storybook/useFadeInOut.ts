import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'

export function useFadeInOut() {
  const ref = React.useRef<THREE.Mesh>(null)
  let scale = 200
  let fadeOut = true
  useFrame(() => {
    if (ref.current) {
      if (fadeOut) {
        scale -= 0.5
        ref.current.position.x += 0.5
      } else {
        scale += 0.5
        ref.current.position.x -= 0.5
      }

      if (scale < 100) {
        fadeOut = false
      } else if (scale > 200) {
        fadeOut = true
      }

      ref.current.geometry = new THREE.IcosahedronGeometry(scale, 5)
    }
  })
  return ref
}

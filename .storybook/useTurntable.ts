import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function useTurntable<T extends THREE.Object3D>() {
  const ref = React.useRef<T>(null)

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01
    }
  })

  return ref
}

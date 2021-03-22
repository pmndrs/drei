import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function useTurntable() {
  const ref = React.useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01
    }
  })

  return ref
}

import * as THREE from 'three'
import * as React from 'react'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier'

export function useSimplification(simplePercent: number) {
  const ref = React.useRef<THREE.Mesh>()
  const original = React.useRef<THREE.BufferGeometry | THREE.Geometry>()
  const modifier = React.useRef<SimplifyModifier>()

  React.useEffect(() => {
    if (!original.current) {
      original.current = ref.current!.geometry.clone()
      modifier.current = new SimplifyModifier()
    }
  }, [])

  React.useEffect(() => {
    if (original.current && ref.current) {
      let geometry = new THREE.BufferGeometry()

      if (original.current instanceof THREE.BufferGeometry) {
        geometry = original.current.clone()
      } else {
        geometry = geometry.fromGeometry(original.current)
      }

      const count = Math.floor(geometry.attributes.position.count * simplePercent) // number of vertices to remove
      ref.current.geometry = modifier.current!.modify(geometry, count)
    }
  }, [simplePercent])

  return ref
}

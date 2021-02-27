import * as React from 'react'
import * as THREE from 'three'
import { SimplifyModifier } from 'three-stdlib/modifiers/SimplifyModifier'

export function useSimplification(simplePercent: number) {
  const ref = React.useRef<THREE.Mesh>()
  const original = React.useRef<THREE.BufferGeometry>()
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

      geometry = original.current.clone()

      const count = Math.floor(geometry.attributes.position.count * simplePercent) // number of vertices to remove
      ref.current.geometry = modifier.current!.modify(geometry, count)
    }
  }, [simplePercent])

  return ref
}

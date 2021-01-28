import * as React from 'react'
import * as THREE from 'three'
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier'

export function useTessellation(passes = 3, maxEdgeLength) {
  const ref = React.useRef<THREE.Mesh>()
  const original = React.useRef<THREE.BufferGeometry>()
  const modifier = React.useRef<TessellateModifier>()

  React.useEffect(() => {
    if (!original.current) {
      original.current = ref.current!.geometry.clone()
      modifier.current = new TessellateModifier(parseInt(maxEdgeLength), passes)
    }
  }, [maxEdgeLength, passes])

  React.useEffect(() => {
    modifier.current!.maxEdgeLength = maxEdgeLength
  }, [maxEdgeLength])

  React.useEffect(() => {
    if (original.current && ref.current) {
      let geometry = new THREE.BufferGeometry()

      geometry = original.current.clone()
      geometry = modifier.current!.modify(geometry)

      ref.current.geometry = geometry
    }
  }, [maxEdgeLength, passes])

  return ref
}

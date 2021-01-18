import * as React from 'react'
import * as THREE from 'three'
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier'

export function useTessellation(passes = 3, maxEdgeLength) {
  const ref = React.useRef<THREE.Mesh>()
  const original = React.useRef<THREE.BufferGeometry | THREE.Geometry>()
  const modifier = React.useRef<TessellateModifier>()

  React.useEffect(() => {
    if (!original.current) {
      original.current = ref.current!.geometry.clone()
      modifier.current = new TessellateModifier(parseInt(maxEdgeLength))
    }
  }, [maxEdgeLength])

  React.useEffect(() => {
    modifier.current!.maxEdgeLength = maxEdgeLength
  }, [maxEdgeLength])

  React.useEffect(() => {
    if (original.current && ref.current) {
      let geometry = new THREE.Geometry()

      if (original.current instanceof THREE.BufferGeometry) {
        geometry.fromBufferGeometry(original.current)
      } else {
        geometry = original.current.clone()
      }

      const bufferGeometry = new THREE.BufferGeometry()

      for (let i = 0; i < passes; i++) {
        modifier.current!.modify(geometry)
      }

      const tessellated = bufferGeometry.fromGeometry(geometry)
      ref.current.geometry = tessellated
    }
  }, [maxEdgeLength, passes])

  return ref
}

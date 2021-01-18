import * as React from 'react'
import * as THREE from 'three'
import { EdgeSplitModifier } from 'three/examples/jsm/modifiers/EdgeSplitModifier'

export function useEdgeSplit(cutOffAngle: number) {
  const ref = React.useRef<THREE.Mesh>()
  const original = React.useRef<THREE.BufferGeometry | THREE.Geometry>()
  const modifier = React.useRef<EdgeSplitModifier>()

  React.useEffect(() => {
    if (!original.current && ref.current) {
      original.current = ref.current.geometry.clone()
      modifier.current = new EdgeSplitModifier()
    }
  }, [])

  React.useEffect(() => {
    if (original.current && ref.current && modifier.current) {
      let geometry = new THREE.Geometry()

      if (original.current instanceof THREE.BufferGeometry) {
        geometry.fromBufferGeometry(original.current)
      } else {
        geometry = original.current.clone()
      }

      const modifiedGeometry = modifier.current.modify(geometry, cutOffAngle)
      modifiedGeometry.computeVertexNormals()

      ref.current.geometry = modifiedGeometry
    }
  }, [cutOffAngle])

  return ref
}

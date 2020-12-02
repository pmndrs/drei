import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { EdgeSplitModifier } from 'three/examples/jsm/modifiers/EdgeSplitModifier'

export function useEdge(cutOffAngle) {
  const ref = useRef<THREE.Mesh>()
  const original = useRef<THREE.BufferGeometry | THREE.Geometry>()
  const modifier = useRef<EdgeSplitModifier>()

  useEffect(() => {
    if (!original.current) {
      original.current = ref.current!.geometry.clone()
      modifier.current = new EdgeSplitModifier()
    }
  }, [])

  useEffect(() => {
    if (original.current && ref.current) {
      let geometry = new THREE.Geometry()

      if (original.current instanceof THREE.BufferGeometry) {
        geometry.fromBufferGeometry(original.current)
      } else {
        geometry = original.current.clone()
      }

      const modifiedGeometry = modifier.current!.modify(geometry, cutOffAngle)
      modifiedGeometry.computeVertexNormals()

      ref.current.geometry = modifiedGeometry
    }
  }, [cutOffAngle])

  return ref
}

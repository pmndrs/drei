import * as THREE from 'three'
import * as React from 'react'
import { SubdivisionModifier } from 'three/examples/jsm/modifiers/SubdivisionModifier'

export function useSubdivision(subdivisions) {
  const ref = React.useRef<THREE.Mesh>()
  const original = React.useRef<THREE.BufferGeometry | THREE.Geometry>()
  const modifier = React.useRef<SubdivisionModifier>()

  React.useEffect(() => {
    if (!original.current) {
      original.current = ref.current!.geometry.clone()
      modifier.current = new SubdivisionModifier(parseInt(subdivisions))
    }
  }, [subdivisions])

  React.useEffect(() => {
    modifier.current!.subdivisions = subdivisions
  }, [subdivisions])

  React.useEffect(() => {
    if (original.current && ref.current) {
      const bufferGeometry = new THREE.BufferGeometry()
      const subdivided = bufferGeometry.fromGeometry(modifier.current!.modify(original.current))
      ref.current.geometry = subdivided
    }
  }, [subdivisions])

  return ref
}

import { ReactThreeFiber } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'

type Props = JSX.IntrinsicElements['lineSegments'] & {
  threshold?: number
  color?: ReactThreeFiber.Color
}

export function Edges({ userData, children, geometry, threshold = 15, color = 'black', ...props }: Props) {
  const ref = React.useRef<THREE.LineSegments>(null!)
  React.useLayoutEffect(() => {
    const parent = ref.current.parent as THREE.Mesh
    if (parent) {
      const geom = geometry || parent.geometry
      if (geom !== ref.current.userData.currentGeom || threshold !== ref.current.userData.currentThreshold) {
        ref.current.userData.currentGeom = geom
        ref.current.userData.currentThreshold = threshold
        ref.current.geometry = new THREE.EdgesGeometry(geom, threshold)
      }
    }
  })
  return (
    <lineSegments ref={ref} raycast={() => null} {...props}>
      {children ? children : <lineBasicMaterial color={color} />}
    </lineSegments>
  )
}

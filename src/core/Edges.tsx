import { ReactThreeFiber } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { ForwardRefComponent } from '../helpers/ts-utils'

type Props = JSX.IntrinsicElements['lineSegments'] & {
  threshold?: number
  color?: ReactThreeFiber.Color
}

export const Edges: ForwardRefComponent<Props, THREE.LineSegments> = React.forwardRef(
  (
    { userData, children, geometry, threshold = 15, color = 'black', ...props }: Props,
    fref: React.ForwardedRef<THREE.LineSegments>
  ) => {
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
    React.useImperativeHandle(fref, () => ref.current)
    return (
      <lineSegments ref={ref} raycast={() => null} {...props}>
        {children ? children : <lineBasicMaterial color={color} />}
      </lineSegments>
    )
  }
)

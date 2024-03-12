import * as React from 'react'
import * as THREE from 'three'
import { LineSegmentsGeometry, LineMaterial } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { useThree, type Color, type ThreeElements, useFrame } from '@react-three/fiber'

export type EdgesRef = THREE.Mesh<LineSegmentsGeometry, LineMaterial>

export interface EdgesProps extends Partial<ThreeElements['mesh']> {
  color?: Color
  opacity?: number
  threshold?: number
  linewidth?: number
  lineWidth?: number
}

export const Edges: ForwardRefComponent<EdgesProps, EdgesRef> = /* @__PURE__ */ React.forwardRef<EdgesRef, EdgesProps>(
  ({ children, threshold = 15, color = 'black', opacity = 1, linewidth, lineWidth, ...props }: EdgesProps, fref) => {
    const ref = React.useRef<EdgesRef>(null!)
    React.useImperativeHandle(fref, () => ref.current, [])

    const geometry = React.useMemo(() => new LineSegmentsGeometry(), [])
    const material = React.useMemo(() => new LineMaterial(), [])
    const size = useThree((s) => s.size)

    const memoizedGeometry = React.useRef<THREE.BufferGeometry>()
    const memoizedThreshold = React.useRef<number>()
    useFrame(() => {
      const edges = ref.current
      const parent = edges.parent as THREE.Mesh
      if (parent) {
        const geometry = edges.geometry ?? parent.geometry
        if (geometry !== memoizedGeometry.current || threshold !== memoizedThreshold.current) {
          memoizedGeometry.current = geometry
          memoizedThreshold.current = threshold

          const points = (new THREE.EdgesGeometry(geometry, threshold).attributes.position as THREE.BufferAttribute)
            .array as Float32Array

          ref.current.geometry.setPositions(points)
          ref.current.geometry.attributes.instanceStart.needsUpdate = true
          ref.current.geometry.attributes.instanceEnd.needsUpdate = true
        }
      }
    })

    return (
      <mesh ref={ref} raycast={() => null} {...props}>
        <primitive object={geometry} attach="geometry" />
        <primitive
          object={material}
          attach="material"
          color={color}
          opacity={opacity}
          transparent={opacity < 1}
          resolution={[size.width, size.height]}
          linewidth={linewidth ?? lineWidth ?? 1}
        />
        {children}
      </mesh>
    )
  }
)

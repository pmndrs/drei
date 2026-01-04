import * as React from 'react'
import * as THREE from '#three'
import { LineSegments2 } from '#three-addons'
import { ForwardRefComponent } from '../../../utils/ts-utils'
import { Line } from '../Line/Line'

export interface EdgesProps {
  threshold?: number
  geometry?: THREE.BufferGeometry
  lineWidth?: number
  color?: THREE.ColorRepresentation
  scale?: number
}

interface EdgesRef {
  computeLineDistances: () => void
}
export const Edges: ForwardRefComponent<EdgesProps, EdgesRef> = /* @__PURE__ */ React.forwardRef<EdgesRef, EdgesProps>(
  ({ threshold = 15, geometry: explicitGeometry, ...props }: EdgesProps, fref) => {
    const ref = React.useRef<LineSegments2>(null!)
    React.useImperativeHandle(fref, () => ref.current, [])

    const tmpPoints = React.useMemo(() => [0, 0, 0, 1, 0, 0], [])
    const memoizedGeometry = React.useRef<THREE.BufferGeometry>(null)
    const memoizedThreshold = React.useRef<number>(null)

    React.useLayoutEffect(() => {
      const parent = ref.current.parent as THREE.Mesh
      const geometry = explicitGeometry ?? parent?.geometry
      if (!geometry) return

      const cached = memoizedGeometry.current === geometry && memoizedThreshold.current === threshold
      if (cached) return
      memoizedGeometry.current = geometry
      memoizedThreshold.current = threshold

      const points = (new THREE.EdgesGeometry(geometry, threshold).attributes.position as THREE.BufferAttribute)
        .array as Float32Array
      ref.current.geometry.setPositions(points)
      ref.current.geometry.attributes.instanceStart.needsUpdate = true
      ref.current.geometry.attributes.instanceEnd.needsUpdate = true
      ref.current.computeLineDistances()
    })

    return <Line segments points={tmpPoints} ref={ref as any} raycast={() => null} {...props} />
  }
)

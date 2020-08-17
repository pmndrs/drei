import React, { forwardRef, useMemo } from 'react'
import { Mesh, Shape, ExtrudeBufferGeometry } from 'three'
import { useUpdate } from 'react-three-fiber'

const eps = 0.00001

function createShape(width: number, height: number, radius0: number) {
  const shape = new Shape()
  const radius = radius0 - eps
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true)
  shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true)
  shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true)
  shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true)
  return shape
}

type Props = {
  width: number
  height: number
  depth: number
  radius0: number
  smoothness: number
} & JSX.IntrinsicElements['mesh']

export const RoundedBox = forwardRef<Mesh, Props>(function RoundedBox(
  { width, height, depth, radius0, smoothness, children, ...rest },
  ref
) {
  const shape = useMemo(() => createShape(width, height, radius0), [width, height, radius0])
  const params = useMemo(
    () => ({
      depth: depth - radius0 * 2,
      bevelEnabled: true,
      bevelSegments: smoothness * 2,
      steps: 1,
      bevelSize: radius0 - eps,
      bevelThickness: radius0,
      curveSegments: smoothness,
    }),
    [depth, radius0, smoothness]
  )
  const geomRef = useUpdate<ExtrudeBufferGeometry>((geometry) => void geometry.center(), [shape, params])
  return (
    <mesh ref={ref as React.MutableRefObject<Mesh>} {...rest}>
      <extrudeBufferGeometry attach="geometry" ref={geomRef} args={[shape, params]} />
      {children}
    </mesh>
  )
})

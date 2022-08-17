import * as React from 'react'
import { Mesh, Shape, ExtrudeGeometry } from 'three'
import { NamedArrayTuple } from '../helpers/ts-utils'

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
  args?: NamedArrayTuple<(width?: number, height?: number, depth?: number) => void>
  radius?: number
  smoothness?: number
  steps?: number
} & Omit<JSX.IntrinsicElements['mesh'], 'args'>

export const RoundedBox = React.forwardRef<Mesh, Props>(function RoundedBox(
  { args: [width = 1, height = 1, depth = 1] = [], radius = 0.05, steps = 1, smoothness = 4, children, ...rest },
  ref
) {
  const shape = React.useMemo(() => createShape(width, height, radius), [width, height, radius])
  const params = React.useMemo(
    () => ({
      depth: depth - radius * 2,
      bevelEnabled: true,
      bevelSegments: smoothness * 2,
      steps,
      bevelSize: radius - eps,
      bevelThickness: radius,
      curveSegments: smoothness,
    }),
    [depth, radius, smoothness]
  )
  const geomRef = React.useRef<ExtrudeGeometry>()

  React.useLayoutEffect(() => {
    if (geomRef.current) {
      geomRef.current.center()
    }
  }, [shape, params])

  return (
    <mesh ref={ref} {...rest}>
      <extrudeGeometry ref={geomRef} args={[shape, params]} />
      {children}
    </mesh>
  )
})

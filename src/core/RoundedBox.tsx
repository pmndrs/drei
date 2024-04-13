import * as React from 'react'
import { Mesh } from 'three'
import { RoundedBoxGeometry, toCreasedNormals } from 'three-stdlib'
import { Node, extend } from '@react-three/fiber'
import { ForwardRefComponent, NamedArrayTuple } from '../helpers/ts-utils'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      roundedBoxGeometry: Node<any, any>
    }
  }
}

type Props = {
  args?: NamedArrayTuple<(width?: number, height?: number, depth?: number) => void>
  segments?: number
  radius?: number
  creaseAngle?: number
} & Omit<JSX.IntrinsicElements['mesh'], 'args'>

export const RoundedBox: ForwardRefComponent<Props, Mesh> = React.forwardRef<Mesh, Props>(function RoundedBox(
  { args: [width = 1, height = 1, depth = 1] = [], segments = 4, radius = 0.05, creaseAngle = 0.4, children, ...rest },
  ref
) {
  React.useMemo(() => extend({ RoundedBoxGeometry }), [])

  const geomRef = React.useRef<RoundedBoxGeometry>(null!)

  React.useLayoutEffect(() => {
    if (geomRef.current) {
      geomRef.current.center()
      toCreasedNormals(geomRef.current, creaseAngle)
    }
  }, [geomRef])

  const args = React.useMemo(() => [width, height, depth, segments, radius], [width, height, depth, segments, radius])

  return (
    <mesh ref={ref} {...rest}>
      <roundedBoxGeometry ref={geomRef} args={args} />
      {children}
    </mesh>
  )
})

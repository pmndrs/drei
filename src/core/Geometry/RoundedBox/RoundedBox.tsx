import * as React from 'react'
import { Mesh, Shape, ExtrudeGeometry } from '#three'
import { ForwardRefComponent, NamedArrayTuple } from '../../../utils/ts-utils'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ThreeElements } from '@react-three/fiber'

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

export type RoundedBoxProps = {
  args?: NamedArrayTuple<(width?: number, height?: number, depth?: number) => void>
  radius?: number
  smoothness?: number
  bevelSegments?: number
  steps?: number
  creaseAngle?: number
} & Omit<ThreeElements['mesh'], 'ref' | 'args'>

export type RoundedBoxGeometryProps = Omit<RoundedBoxProps, 'children'> &
  Omit<ThreeElements['extrudeGeometry'], 'args' | 'ref'>

/**
 * A box buffer geometry with rounded corners, done with extrusion.
 *
 * Geometry is also available via `<RoundedBoxGeometry />` for use with `@react-three/csg`.
 *
 * Note: If you animate `args` every frame, memoize the `[width, height, depth]` tuple
 * with `React.useMemo` to avoid replacing the geometry each tick.
 *
 * @example Basic usage
 * ```jsx
 * <RoundedBox
 *   args={[1, 1, 1]}
 *   radius={0.05}
 *   steps={1}
 *   smoothness={4}
 *   bevelSegments={4}
 *   creaseAngle={0.4}
 * >
 *   <meshPhongMaterial color="#f3f3f3" wireframe />
 * </RoundedBox>
 * ```
 */
export const RoundedBox: ForwardRefComponent<RoundedBoxProps, Mesh> = /* @__PURE__ */ React.forwardRef<
  Mesh,
  RoundedBoxProps
>(function RoundedBox(
  {
    args: [width = 1, height = 1, depth = 1] = [],
    radius = 0.05,
    steps = 1,
    smoothness = 4,
    bevelSegments = 4,
    creaseAngle = 0.4,
    children,
    ...rest
  },
  ref
) {
  return (
    <mesh ref={ref} {...rest}>
      <RoundedBoxGeometry
        args={[width, height, depth]}
        radius={radius}
        steps={steps}
        smoothness={smoothness}
        bevelSegments={bevelSegments}
        creaseAngle={creaseAngle}
      />
      {children}
    </mesh>
  )
})

export const RoundedBoxGeometry: ForwardRefComponent<RoundedBoxGeometryProps, ExtrudeGeometry> =
  /* @__PURE__ */ React.forwardRef<ExtrudeGeometry, RoundedBoxGeometryProps>(function RoundedBoxGeometry(
    {
      args: [width = 1, height = 1, depth = 1] = [],
      radius = 0.05,
      steps = 1,
      smoothness = 4,
      bevelSegments = 4,
      creaseAngle = 0.4,
      ...rest
    },
    ref
  ) {
    const shape = React.useMemo(() => createShape(width, height, radius), [width, height, radius])
    const params = React.useMemo(
      () => ({
        depth: depth - radius * 2,
        bevelEnabled: true,
        bevelSegments: bevelSegments * 2,
        steps,
        bevelSize: radius - eps,
        bevelThickness: radius,
        curveSegments: smoothness,
      }),
      [depth, radius, smoothness, bevelSegments, steps]
    )
    const geomRef = React.useRef<ExtrudeGeometry>(null!)

    React.useLayoutEffect(() => {
      if (geomRef.current) {
        geomRef.current.center()
        toCreasedNormals(geomRef.current, creaseAngle)
      }
    }, [shape, params, creaseAngle])

    React.useImperativeHandle(ref, () => geomRef.current)

    return <extrudeGeometry ref={geomRef} args={[shape, params]} {...rest} />
  })

import * as React from 'react'
import * as THREE from 'three'
import { ReactThreeFiber } from 'react-three-fiber'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial, LineMaterialParameters } from 'three/examples/jsm/lines/LineMaterial'
import { Line2 } from 'three/examples/jsm/lines/Line2'

type Props = {
  points: [number, number, number][]
  color?: THREE.Color | string | number
  vertexColors?: [number, number, number][]
  lineWidth?: number
} & Omit<ReactThreeFiber.Object3DNode<Line2, typeof Line2>, 'args'> &
  Omit<
    ReactThreeFiber.Object3DNode<LineMaterial, [LineMaterialParameters]>,
    'color' | 'vertexColors' | 'resolution' | 'args'
  >

export const Line = React.forwardRef<Line2, Props>(function Line(
  { points, color = 'black', vertexColors, lineWidth, dashed, ...rest },
  ref
) {
  const [line2] = React.useState(() => new Line2())
  const [lineGeometry] = React.useState(() => new LineGeometry())
  const [lineMaterial] = React.useState(() => new LineMaterial())
  const [resolution] = React.useState(() => new THREE.Vector2(512, 512))
  React.useEffect(() => {
    lineGeometry.setPositions(points.flat())
    if (vertexColors) lineGeometry.setColors(vertexColors.flat())
    line2.computeLineDistances()
  }, [points, vertexColors, line2, lineGeometry])
  React.useLayoutEffect(() => {
    if (dashed) {
      lineMaterial.defines.USE_DASH = ''
    } else {
      // Setting lineMaterial.defines.USE_DASH to undefined is apparently not sufficient.
      delete lineMaterial.defines.USE_DASH
    }
    lineMaterial.needsUpdate = true
  }, [dashed, lineMaterial])
  return (
    <primitive dispose={undefined} object={line2} ref={ref} {...rest}>
      <primitive dispose={undefined} object={lineGeometry} attach="geometry" />
      <primitive
        dispose={undefined}
        object={lineMaterial}
        attach="material"
        color={color}
        vertexColors={Boolean(vertexColors)}
        resolution={resolution}
        linewidth={lineWidth}
        dashed={dashed}
        {...rest}
      />
    </primitive>
  )
})

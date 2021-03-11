import * as React from 'react'
import { Vector2, Vector3, Color } from 'three'
import { ReactThreeFiber } from 'react-three-fiber'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial, LineMaterialParameters } from 'three/examples/jsm/lines/LineMaterial'
import { Line2 } from 'three/examples/jsm/lines/Line2'

type Props = {
  points: Array<Vector3 | [number, number, number]>
  color?: Color | string | number
  vertexColors?: Array<Color | [number, number, number]>
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
  const [lineMaterial] = React.useState(() => new LineMaterial())
  const [resolution] = React.useState(() => new Vector2(512, 512))

  const lineGeom = React.useMemo(() => {
    const geom = new LineGeometry()
    const pValues = points.map((p) => (p instanceof Vector3 ? p.toArray() : p))
    geom.setPositions(pValues.flat())

    if (vertexColors) {
      const cValues = vertexColors.map((c) => (c instanceof Color ? c.toArray() : c))
      geom.setColors(cValues.flat())
    }

    return geom
  }, [points, vertexColors])

  React.useLayoutEffect(() => {
    line2.computeLineDistances()
  }, [points, line2])

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
      <primitive dispose={undefined} object={lineGeom} attach="geometry" />
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

import * as React from 'react'
import { QuadraticBezierCurve3, Vector3 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { Line, LineProps } from './Line'
import { Object3DNode } from '@react-three/fiber'

type Props = Omit<LineProps, 'points' | 'ref'> & {
  start: Vector3 | [number, number, number]
  end: Vector3 | [number, number, number]
  mid?: Vector3 | [number, number, number]
  segments?: number
}

type Line2Props = Object3DNode<Line2, typeof Line2> & {
  setPoints: (
    start: Vector3 | [number, number, number],
    end: Vector3 | [number, number, number],
    mid: Vector3 | [number, number, number]
  ) => void
}

const v = new Vector3()
export const QuadraticBezierLine = React.forwardRef<Line2Props, Props>(function QuadraticBezierLine(
  { start = [0, 0, 0], end = [0, 0, 0], mid, segments = 20, ...rest },
  ref
) {
  const line = React.useRef<Line2Props>(null!)
  React.useImperativeHandle(ref, () => line.current)
  const [curve] = React.useState(() => new QuadraticBezierCurve3(undefined as any, undefined as any, undefined as any))
  const getPoints = React.useCallback((start, end, mid, segments = 20) => {
    if (start instanceof Vector3) curve.v0.copy(start)
    else curve.v0.set(...(start as [number, number, number]))
    if (end instanceof Vector3) curve.v2.copy(end)
    else curve.v2.set(...(end as [number, number, number]))
    if (mid instanceof Vector3) {
      curve.v1.copy(mid)
    } else {
      curve.v1.copy(
        curve.v0
          .clone()
          .add(curve.v2.clone().sub(curve.v0))
          .add(v.set(0, curve.v0.y - curve.v2.y, 0))
      )
    }
    return curve.getPoints(segments)
  }, [])

  React.useLayoutEffect(() => {
    line.current.setPoints = (
      start: Vector3 | [number, number, number],
      end: Vector3 | [number, number, number],
      mid: Vector3 | [number, number, number]
    ) => {
      const points = getPoints(start, end, mid)
      if (line.current.geometry) line.current.geometry.setPositions(points.map((p) => p.toArray()).flat())
    }
  }, [])

  const points = React.useMemo(() => getPoints(start, end, mid, segments), [start, end, mid, segments])
  return <Line ref={line as any} points={points} {...rest} />
})

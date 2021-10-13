import * as React from 'react'
import { QuadraticBezierCurve3, Vector3 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { Line, LineProps } from './Line'

type Props = Omit<LineProps, 'points' | 'ref'> & {
  start: Vector3 | [number, number, number]
  end: Vector3 | [number, number, number]
  mid?: Vector3 | [number, number, number]
  segments?: number
}

export const QuadraticBezierLine = React.forwardRef<Line2, Props>(function QuadraticBezierLine(
  { start, end, mid, segments = 20, ...rest },
  ref
) {
  const points = React.useMemo(() => {
    const startV = start instanceof Vector3 ? start : new Vector3(...start)
    const endV = end instanceof Vector3 ? end : new Vector3(...end)

    const mid2 =
      mid ||
      startV
        .clone()
        .add(endV.clone().sub(startV))
        .add(new Vector3(0, startV.y - endV.y, 0))
    const midV = mid2 instanceof Vector3 ? mid2 : new Vector3(...mid2)

    const interpolatedV = new QuadraticBezierCurve3(startV, midV, endV).getPoints(segments)

    return interpolatedV
  }, [start, end, mid, segments])

  return <Line ref={ref as any} points={points} {...rest} />
})

import * as React from 'react'
import { CubicBezierCurve3, Vector3 } from '#three'
import { Line2 } from '#three-addons'
import { Line, LineProps } from '../Line'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type CubicBezierLineProps = Omit<LineProps, 'points' | 'ref'> & {
  start: Vector3 | [number, number, number]
  end: Vector3 | [number, number, number]
  midA: Vector3 | [number, number, number]
  midB: Vector3 | [number, number, number]
  segments?: number
}

/**
 * Renders a THREE.Line2 using THREE.CubicBezierCurve3 for interpolation.
 *
 * @example Basic usage
 * ```jsx
 * <CubicBezierLine
 *   start={[0, 0, 0]}
 *   midA={[1, 1, 0]}
 *   midB={[2, 1, 0]}
 *   end={[3, 0, 0]}
 *   segments={20}
 * />
 * ```
 */
export const CubicBezierLine: ForwardRefComponent<CubicBezierLineProps, Line2> = /* @__PURE__ */ React.forwardRef<
  Line2,
  CubicBezierLineProps
>(function CubicBezierLine({ start, end, midA, midB, segments = 20, ...rest }, ref) {
  const points = React.useMemo(() => {
    const startV = start instanceof Vector3 ? start : new Vector3(...start)
    const endV = end instanceof Vector3 ? end : new Vector3(...end)
    const midAV = midA instanceof Vector3 ? midA : new Vector3(...midA)
    const midBV = midB instanceof Vector3 ? midB : new Vector3(...midB)
    const interpolatedV = new CubicBezierCurve3(startV, midAV, midBV, endV).getPoints(segments)
    return interpolatedV
  }, [start, end, midA, midB, segments])

  return <Line ref={ref} points={points} {...rest} />
})

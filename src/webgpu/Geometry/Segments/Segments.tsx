import * as THREE from 'three/webgpu'
import * as React from 'react'
import { extend, useFrame, ReactThreeFiber, ThreeElements, ThreeElement } from '@react-three/fiber'
import { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'

import { ForwardRefComponent } from '../../../utils/ts-utils'

//* Types ==============================
// Note: Not importing LineMaterialParameters to avoid pulling in WebGL LineMaterial

export type SegmentsProps = {
  limit?: number
  lineWidth?: number
  linewidth?: number
  dashed?: boolean
  children: React.ReactNode
}

type Api = {
  subscribe: (ref: React.RefObject<SegmentObject>) => void
}

type SegmentRef = React.RefObject<SegmentObject>
export type SegmentProps = Omit<ThreeElements['segmentObject'], 'ref' | 'start' | 'end' | 'color'> & {
  start?: ReactThreeFiber.Vector3
  end?: ReactThreeFiber.Vector3
  color?: ReactThreeFiber.Color
}

const context = /* @__PURE__ */ React.createContext<Api>(null!)

/**
 * High-performance line segments renderer.
 * WebGPU version using Line2NodeMaterial.
 *
 * @example Basic usage
 * ```jsx
 * <Segments limit={1000} lineWidth={1}>
 *   <Segment start={[0, 0, 0]} end={[1, 1, 0]} color="red" />
 *   <Segment start={[1, 1, 0]} end={[2, 0, 0]} color="blue" />
 * </Segments>
 * ```
 */
const Segments: ForwardRefComponent<SegmentsProps, LineSegments2> = /* @__PURE__ */ React.forwardRef<
  LineSegments2,
  SegmentsProps
>((props, forwardedRef) => {
  React.useMemo(() => extend({ SegmentObject }), [])

  const { limit = 1000, lineWidth = 1.0, children, ...rest } = props
  const [segments, setSegments] = React.useState<Array<SegmentRef>>([])

  const line = React.useMemo(() => new LineSegments2(), [])

  const [geometry] = React.useState(() => new LineSegmentsGeometry())
  const [resolution] = React.useState(() => new THREE.Vector2(512, 512))

  const [positions] = React.useState<number[]>(() => Array(limit * 6).fill(0))
  const [colors] = React.useState<number[]>(() => Array(limit * 6).fill(0))
  const material = React.useMemo(
    () =>
      new THREE.Line2NodeMaterial({
        color: 0xffffff,
        linewidth: 1,
        worldUnits: false,
        vertexColors: true,
        alphaToCoverage: true,
      }),
    []
  )
  const api: Api = React.useMemo(
    () => ({
      subscribe: (ref: React.RefObject<SegmentObject>) => {
        setSegments((segments) => [...segments, ref])
        return () => setSegments((segments) => segments.filter((item) => item.current !== ref.current))
      },
    }),
    []
  )

  useFrame(() => {
    for (let i = 0; i < limit; i++) {
      const segment = segments[i]?.current
      if (segment) {
        positions[i * 6 + 0] = segment.start?.x || 0
        positions[i * 6 + 1] = segment.start?.y || 0
        positions[i * 6 + 2] = segment.start?.z || 0

        positions[i * 6 + 3] = segment.end?.x || 0
        positions[i * 6 + 4] = segment.end?.y || 0
        positions[i * 6 + 5] = segment.end?.z || 0

        colors[i * 6 + 0] = segment.color.r
        colors[i * 6 + 1] = segment.color.g
        colors[i * 6 + 2] = segment.color.b

        colors[i * 6 + 3] = segment.color.r
        colors[i * 6 + 4] = segment.color.g
        colors[i * 6 + 5] = segment.color.b
      }
    }
    geometry.setColors(colors)
    geometry.setPositions(positions)
    line.computeLineDistances()
  })

  return (
    <primitive object={line} ref={forwardedRef}>
      <primitive object={geometry} attach="geometry" />
      <primitive
        object={material}
        attach="material"
        vertexColors={true}
        resolution={resolution}
        linewidth={lineWidth}
        {...rest}
      />
      <context.Provider value={api}>{children}</context.Provider>
    </primitive>
  )
})

declare module '@react-three/fiber' {
  interface ThreeElements {
    segmentObject: ThreeElement<typeof SegmentObject>
  }
}

export class SegmentObject {
  color: THREE.Color
  start?: THREE.Vector3
  end?: THREE.Vector3
  constructor() {
    this.color = new THREE.Color('red')
    this.start = new THREE.Vector3(0, 0, 0)
    this.end = new THREE.Vector3(0, 0, 0)
  }
}

const normPos = (pos: SegmentProps['start']): THREE.Vector3 => {
  if (!pos) return new THREE.Vector3(0, 0, 0)

  return pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(...(typeof pos === 'number' ? [pos, pos, pos] : pos))
}

const Segment: ForwardRefComponent<SegmentProps, SegmentObject> = /* @__PURE__ */ React.forwardRef<
  SegmentObject,
  SegmentProps
>(({ color, start, end }, forwardedRef) => {
  const api = React.useContext<Api>(context)
  if (!api) throw 'Segment must used inside Segments component.'
  const ref = React.useRef<SegmentObject>(null!)
  React.useImperativeHandle(forwardedRef, () => ref.current, [])
  React.useLayoutEffect(() => api.subscribe(ref), [])
  return <segmentObject ref={ref} color={color} start={normPos(start)} end={normPos(end)} />
})

export { Segments, Segment }

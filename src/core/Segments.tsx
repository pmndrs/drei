import * as THREE from 'three'
import * as React from 'react'
import mergeRefs from 'react-merge-refs'
import { extend, useFrame, ReactThreeFiber } from '@react-three/fiber'
import { Line2, LineSegmentsGeometry, LineMaterial } from 'three-stdlib'

type SegmentsProps = {
  limit?: number
  lineWidth?: number
  children: React.ReactNode
}

type Api = {
  subscribe: (ref: React.RefObject<SegmentObject>) => void
}

type SegmentRef = React.RefObject<SegmentObject>
type SegmentProps = Omit<JSX.IntrinsicElements['segmentObject'], 'start' | 'end' | 'color'> & {
  start: ReactThreeFiber.Vector3
  end: ReactThreeFiber.Vector3
  color?: ReactThreeFiber.Color
}

const context = React.createContext<Api>(null!)

const Segments = React.forwardRef<Line2, SegmentsProps>((props, forwardedRef) => {
  React.useMemo(() => extend({ SegmentObject }), [])

  const { limit = 1000, lineWidth = 1.0, children, ...rest } = props
  const [segments, setSegments] = React.useState<Array<SegmentRef>>([])

  const [line] = React.useState(() => new Line2())
  const [material] = React.useState(() => new LineMaterial())
  const [geometry] = React.useState(() => new LineSegmentsGeometry())
  const [resolution] = React.useState(() => new THREE.Vector2(512, 512))

  const [positions] = React.useState<number[]>(() => Array(limit * 6).fill(0))
  const [colors] = React.useState<number[]>(() => Array(limit * 6).fill(0))

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
        positions[i * 6 + 0] = segment.start.x
        positions[i * 6 + 1] = segment.start.y
        positions[i * 6 + 2] = segment.start.z

        positions[i * 6 + 3] = segment.end.x
        positions[i * 6 + 4] = segment.end.y
        positions[i * 6 + 5] = segment.end.z

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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      segmentObject: ReactThreeFiber.Object3DNode<SegmentObject, typeof SegmentObject>
    }
  }
}

export class SegmentObject {
  color: THREE.Color
  start: THREE.Vector3
  end: THREE.Vector3
  constructor() {
    this.color = new THREE.Color('white')
    this.start = new THREE.Vector3(0, 0, 0)
    this.end = new THREE.Vector3(0, 0, 0)
  }
}

const normPos = (pos: SegmentProps['start']): SegmentObject['start'] =>
  pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(...(typeof pos === 'number' ? [pos, pos, pos] : pos))

const Segment = React.forwardRef<SegmentObject, SegmentProps>(({ color, start, end }, forwardedRef) => {
  const api = React.useContext<Api>(context)
  if (!api) throw 'Segment must used inside Segments component.'
  const ref = React.useRef<SegmentObject>(null)
  React.useLayoutEffect(() => api.subscribe(ref), [])
  return <segmentObject ref={mergeRefs([ref, forwardedRef])} color={color} start={normPos(start)} end={normPos(end)} />
})

export { Segments, Segment }

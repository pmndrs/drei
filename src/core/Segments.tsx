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

type Segment = {
  start: ReactThreeFiber.Vector3
  end: ReactThreeFiber.Vector3
  color?: ReactThreeFiber.Color
}

type SegmentRef = React.RefObject<Segment>
type SegmentProps = Omit<JSX.IntrinsicElements['segmentObject'], 'start' | 'end' | 'color'> & Segment

const context = React.createContext<Api>(null!)

const arrColor = (color: Segment['color']) => (color instanceof THREE.Color ? color.toArray() : color)
const arrPos = (pos: Segment['start']) => (pos instanceof THREE.Vector3 ? pos.toArray() : pos)

const Segments = React.forwardRef<Line2, SegmentsProps>((props, forwardedRef) => {
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
      const segmentStart = segment ? arrPos(segment.start) : [0, 0, 0]
      const segmentEnd = segment ? arrPos(segment.end) : [0, 0, 0]
      const segmentColor = segment ? arrColor(segment.color) : [1, 1, 1]
      for (var j = 0; j < 3; j++) {
        positions[i * 6 + j] = segmentStart[j]
        positions[i * 6 + j + 3] = segmentEnd[j]
        colors[i * 6 + j] = segmentColor?.[j]
        colors[i * 6 + j + 3] = segmentColor?.[j]
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

const Segment = React.forwardRef<SegmentObject, SegmentProps>((props, forwardedRef) => {
  const api = React.useContext<Api>(context)
  if (!api) throw 'Segment must used inside Segments component.'
  const ref = React.useRef<SegmentObject>(null)
  React.useMemo(() => extend({ SegmentObject }), [])
  React.useLayoutEffect(() => api.subscribe(ref), [])
  return <segmentObject ref={mergeRefs([ref, forwardedRef])} {...props} />
})

export { Segments, Segment }

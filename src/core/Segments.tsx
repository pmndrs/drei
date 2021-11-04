import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { Line2, LineSegmentsGeometry, LineMaterial, LineMaterialParameters } from 'three-stdlib'

type SegmentsProps = {
  limit?: number
  lineWidth?: number
  children: React.ReactNode
}

type Api = {
  subscribe: (ref) => void
}

type Segment = {
  start: THREE.Vector3 | [number, number, number]
  end: THREE.Vector3 | [number, number, number]
  color?: THREE.Color | [number, number, number]
}

type SegmentRef = React.RefObject<Segment>
type SegmentProps = Segment

const context = React.createContext<Api>(null!)

const arrColor = (color) => (color instanceof THREE.Color ? color.toArray() : color)
const arrPos = (pos) => (pos instanceof THREE.Vector3 ? pos.toArray() : pos)

const Segments = React.forwardRef<Line2, SegmentsProps>((props, forwardedRef) => {
  const { limit = 1000, lineWidth = 1.0, children, ...rest } = props
  const [segments, setSegments] = React.useState<Array<SegmentRef>>([])

  const [line] = React.useState(() => new Line2())
  const [material] = React.useState(() => new LineMaterial())
  const [geometry] = React.useState(() => new LineSegmentsGeometry())
  const [resolution] = React.useState(() => new THREE.Vector2(512, 512))
  const [positions] = React.useState(() => Array(limit).fill(0))
  const [colors] = React.useState(() => Array(limit).fill(1))

  const api = React.useMemo(
    () => ({
      subscribe: (ref) => {
        setSegments((segments) => [...segments, ref])
        return () => setSegments((segments) => segments.filter((item) => item.current !== ref.current))
      },
    }),
    []
  )

  useFrame(() => {
    positions.length = segments.length * 6
    colors.length = segments.length * 6
    segments.forEach((segmentRef, i) => {
      const segment = segmentRef.current
      if (segment) {
        const segmentStart = arrPos(segment.start)
        const segmentEnd = arrPos(segment.end)
        const segmentColor = arrColor(segment.color)
        for (var j = 0; j < 3; j++) {
          positions[i * 6 + j] = segmentStart[j]
          positions[i * 6 + j + 3] = segmentEnd[j]
          colors[i * 6 + j] = segmentColor[j]
          colors[i * 6 + j + 3] = segmentColor[j]
        }
      }
    })
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

const Segment = React.forwardRef<Segment, SegmentProps>((props, forwardedRef) => {
  const { start, end, color } = props
  const api = React.useContext<Api>(context)
  if (!api) throw 'Segment must used inside Segments component.'
  const ref = React.useRef<Segment>({ start: [0, 0, 0], end: [0, 0, 0], color: [1, 1, 1] })
  React.useLayoutEffect(() => api.subscribe(forwardedRef || ref), [])
  React.useLayoutEffect(() => {
    var currRef = forwardedRef || ref
    start && Object.assign((currRef as React.RefObject<Segment>).current, { start })
    end && Object.assign((currRef as React.RefObject<Segment>).current, { end })
    color && Object.assign((currRef as React.RefObject<Segment>).current, { color })
  }, [start, end, color])
  return null
})

export { Segments, Segment }

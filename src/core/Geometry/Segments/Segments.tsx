import * as THREE from '#three'
import * as React from 'react'
import { extend, useFrame, ReactThreeFiber, ThreeElements, ThreeElement, useThree } from '@react-three/fiber'
import { LineGeometry, LineMaterial, Line2, LineSegments2 } from '#three-addons'
// hack to be webgpu compatible
import { Line2 as Line2WebGPU } from 'three/examples/jsm/lines/webgpu/Line2.js'
import { LineSegments2 as LineSegments2WebGPU } from 'three/examples/jsm/lines/webgpu/LineSegments2.js'
import { Line2NodeMaterial } from 'three/webgpu'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterialParameters } from 'three/examples/jsm/lines/LineMaterial.js'

import { ForwardRefComponent } from '../../../utils/ts-utils'
import { color } from 'three/tsl'

export type SegmentsProps = LineMaterialParameters & {
  limit?: number
  lineWidth?: number
  children: React.ReactNode
}

type Api = {
  subscribe: (ref: React.RefObject<SegmentObject>) => void
}

type SegmentRef = React.RefObject<SegmentObject>
export type SegmentProps = Omit<ThreeElements['segmentObject'], 'ref' | 'start' | 'end' | 'color'> & {
  start: ReactThreeFiber.Vector3
  end: ReactThreeFiber.Vector3
  color?: ReactThreeFiber.Color
}

const context = /* @__PURE__ */ React.createContext<Api>(null!)

/**
 * High-performance line segments renderer.
 * Renders multiple line segments efficiently with instancing.
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

  const { isLegacy } = useThree()
  const line = React.useMemo(() => (isLegacy ? new LineSegments2() : new LineSegments2WebGPU()), [isLegacy])

  const [geometry] = React.useState(() => new LineSegmentsGeometry())
  const [resolution] = React.useState(() => new THREE.Vector2(512, 512))

  const [positions] = React.useState<number[]>(() => Array(limit * 6).fill(0))
  const [colors] = React.useState<number[]>(() => Array(limit * 6).fill(0))
  const material = React.useMemo(() => {
    return isLegacy
      ? new LineMaterial()
      : new Line2NodeMaterial({
          color: 0xffffff,
          linewidth: 1, // in world units with size attenuation, pixels otherwise
          worldUnits: false,
          vertexColors: true,

          alphaToCoverage: true,
        })
  }, [isLegacy])
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
    // TEST: Fixed color array for 4 segments (each segment = 6 values: 2 points * RGB)
    const testColors = [
      1,
      0,
      0,
      1,
      0,
      0, // segment 1: red
      0,
      1,
      0,
      0,
      1,
      0, // segment 2: green
      0,
      0,
      1,
      0,
      0,
      1, // segment 3: blue
      1,
      1,
      0,
      1,
      1,
      0, // segment 4: yellow
    ]
    geometry.setColors(colors)
    geometry.setPositions(positions)
    line.computeLineDistances()
  })

  // maybe webgpu isnt setting the material?

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
  start: THREE.Vector3
  end: THREE.Vector3
  constructor() {
    this.color = new THREE.Color('red')
    this.start = new THREE.Vector3(0, 0, 0)
    this.end = new THREE.Vector3(0, 0, 0)
  }
}

const normPos = (pos: SegmentProps['start']): SegmentObject['start'] =>
  pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(...(typeof pos === 'number' ? [pos, pos, pos] : pos))

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

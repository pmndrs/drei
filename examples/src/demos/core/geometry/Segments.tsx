import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { OrbitControls } from '@react-three/drei/core'
import { Segments, Segment, SegmentProps, SegmentObject } from '@react-three/drei/legacy'
import { Segments as WebGPUSegments, Segment as WebGPUSegment } from '@react-three/drei/webgpu'
import { ExampleCard } from '../../../components/ExampleCard'
import { PlatformSwitch } from '@ex/components/PlatformSwitch'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

//* Segments Demo ==============================

function Scene() {
  const segments: [number, number, number][] = [
    [-2, -1, 0],
    [-1, 1, 0],
    [0, -1, 0],
    [1, 1, 0],
    [2, -1, 0],
  ]

  const WrappedSegment = (props: SegmentProps) => {
    return <PlatformSwitch legacy={<Segment {...props} />} webgpu={<WebGPUSegment {...props} />} />
  }

  // for ref based update
  const segmentRef = useRef<SegmentObject>(null)
  useFrame(({ elapsed }, delta) => {
    if (!segmentRef.current) return

    // Askew rotation: different frequencies and phases for each axis
    const radius = 2
    const startX = Math.sin(elapsed * 0.7) * radius
    const startY = Math.cos(elapsed * 0.9) * radius
    const startZ = Math.sin(elapsed * 1.1 + Math.PI / 3) * radius

    const endX = Math.cos(elapsed * 0.8 + Math.PI / 4) * radius
    const endY = Math.sin(elapsed * 1.0 + Math.PI / 2) * radius
    const endZ = Math.cos(elapsed * 1.2) * radius

    segmentRef.current.start?.set(startX, startY, startZ)
    segmentRef.current.end?.set(endX + 3, endY + 3, endZ + 3)
    segmentRef.current.color.setRGB(0.4, 0.3, 0)
  })
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Line segments */}
      <Segments limit={100} lineWidth={3}>
        <Segment ref={segmentRef} />

        <WrappedSegment start={segments[0]} end={segments[1]} color="hotpink" />
        <WrappedSegment start={segments[1]} end={segments[2]} color="orange" />
        <WrappedSegment start={segments[2]} end={segments[3]} color="yellow" />
        <WrappedSegment start={segments[3]} end={segments[4]} color="lightblue" />
      </Segments>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function SegmentsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Segments" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

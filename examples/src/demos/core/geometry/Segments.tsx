import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { Segments, OrbitControls, Segment } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Segments Demo ==============================

function Scene() {
  const segments = [
    [-2, -1, 0],
    [-1, 1, 0],
    [0, -1, 0],
    [1, 1, 0],
    [2, -1, 0],
  ]

  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Line segments */}
      <Segments limit={100} lineWidth={3}>
        <Segment start={segments[0]} end={segments[1]} color="hotpink" />
        <Segment start={segments[1]} end={segments[2]} color="orange" />
        <Segment start={segments[2]} end={segments[3]} color="yellow" />
        <Segment start={segments[3]} end={segments[4]} color="lightblue" />
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

import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { CubicBezierLine, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* CubicBezierLine Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Cubic Bezier curve */}
      <CubicBezierLine
        start={[-2, 0, 0]}
        end={[2, 0, 0]}
        midA={[-1, 2, 0]}
        midB={[1, -2, 0]}
        color="hotpink"
        lineWidth={3}
      />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />
    </>
  )
}

export default function CubicBezierLineDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CubicBezierLine" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

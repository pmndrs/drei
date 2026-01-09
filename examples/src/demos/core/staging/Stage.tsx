import { Stage, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Stage Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Stage with auto lighting */}
      <Stage>
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </Stage>
    </>
  )
}

export default function StageDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Stage" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

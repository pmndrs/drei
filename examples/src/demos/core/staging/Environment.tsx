import { Environment, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Environment Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Environment map */}
      <Environment preset="city" />

      {/* Reflective sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="white" metalness={1} roughness={0} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function EnvironmentDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Environment" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

import { Points, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* PointMaterial Demo ==============================

function Scene() {
  const positions = new Float32Array(500 * 3)
  for (let i = 0; i < 500; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 5
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
  }

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Points with material */}
      <Points positions={positions}>
        <pointsMaterial size={0.1} color="hotpink" sizeAttenuation />
      </Points>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />
    </>
  )
}

export default function PointMaterialDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="PointMaterial" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}


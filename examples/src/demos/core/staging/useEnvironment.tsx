import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* useEnvironment Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="white" metalness={1} roughness={0} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseEnvironmentDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useEnvironment" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> useEnvironment is a hook for loading environment maps.
            <br />
            See Environment demo for usage example.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


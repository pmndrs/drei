import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* useContextBridge Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference object */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseContextBridgeDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useContextBridge" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> useContextBridge is a hook for bridging React contexts.
            <br />
            See documentation for implementation details.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


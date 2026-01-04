import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* CycleRaycast Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Overlapping objects for raycast cycling */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="orange" transparent opacity={0.7} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CycleRaycastDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CycleRaycast" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> CycleRaycast cycles through overlapping objects on click.
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


import { Canvas } from '@react-three/fiber'
import { Sky, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Sky Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Procedural sky */}
      <Sky sunPosition={[100, 20, 100]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 20, 100]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </>
  )
}

export default function SkyDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Sky" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


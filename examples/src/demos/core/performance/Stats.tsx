import { Canvas } from '@react-three/fiber'
import { Stats, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Stats Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference objects */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[(i % 5 - 2) * 1.5, Math.floor(i / 5) * 1.5 - 0.5, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      ))}

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />

      {/* Stats panel */}
      <Stats />
    </>
  )
}

export default function StatsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Stats" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


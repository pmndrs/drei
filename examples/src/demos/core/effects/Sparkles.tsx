import { Canvas } from '@react-three/fiber'
import { Sparkles, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Sparkles Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference object */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {/* Particle sparkles */}
      <Sparkles count={100} size={3} color="orange" scale={[4, 4, 4]} speed={0.5} />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function SparklesDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Sparkles" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


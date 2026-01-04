import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Float Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Floating objects */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={2} floatIntensity={1} position={[2, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Float>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />
    </>
  )
}

export default function FloatDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Float" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


import { Canvas } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Stars Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Starfield */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </>
  )
}

export default function StarsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Stars" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <color attach="background" args={['#000']} />
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


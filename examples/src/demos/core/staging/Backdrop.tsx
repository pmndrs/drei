import { Canvas } from '@react-three/fiber'
import { Backdrop, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Backdrop Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {/* Backdrop plane */}
      <Backdrop floor={2} segments={20}>
        <meshStandardMaterial color="#333" />
      </Backdrop>
    </>
  )
}

export default function BackdropDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Backdrop" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


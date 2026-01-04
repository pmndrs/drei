import { Canvas } from '@react-three/fiber'
import { Shadow, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Shadow Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {/* Contact shadows */}
      <Shadow position={[0, 0, 0]} opacity={0.5} scale={10} blur={2} far={4} color={'black'} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </>
  )
}

export default function ShadowDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Shadow" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 3, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}

import { Canvas } from '@react-three/fiber'
import { PresentationControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* PresentationControls Demo ==============================

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <PresentationControls
        global
        zoom={1}
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
        speed={1.5}
        snap
      >
        {/* Object group */}
        <group>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>

          <mesh position={[2, 0.5, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="orange" />
          </mesh>

          <mesh position={[-2, 0.5, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshStandardMaterial color="lightblue" />
          </mesh>
        </group>
      </PresentationControls>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[10, 10, '#666', '#444']} />
    </>
  )
}

export default function PresentationControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="PresentationControls" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 2, 8] }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


import { Canvas } from '@react-three/fiber'
import { Wireframe, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Wireframe Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mesh with wireframe */}
      <mesh>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial color="hotpink" />
        <Wireframe stroke="white" thickness={0.01} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function WireframeDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Wireframe" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


import { Canvas } from '@react-three/fiber'
import { Cloud, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Cloud Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Volumetric clouds */}
      <Cloud position={[0, 0, 0]} segments={20} bounds={[3, 2, 2]} volume={6} color="white" fade={100} />

      {/* Ground reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CloudDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Cloud" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


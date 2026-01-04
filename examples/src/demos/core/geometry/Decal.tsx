import { Canvas } from '@react-three/fiber'
import { Decal, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Decal Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mesh with decal projected onto it */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="lightblue" />
        <Decal position={[0, 0, 1]} rotation={[0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
          <meshBasicMaterial color="hotpink" transparent opacity={0.8} />
        </Decal>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function DecalDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Decal" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


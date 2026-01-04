import { Canvas } from '@react-three/fiber'
import { Text, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Text Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Troika text rendering */}
      <Text position={[0, 0, 0]} fontSize={0.5} color="hotpink" anchorX="center" anchorY="middle">
        Hello drei!
      </Text>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function TextDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Text" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


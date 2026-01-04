import { Canvas } from '@react-three/fiber'
import { RoundedBox, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* RoundedBox Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Box with rounded edges */}
      <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color="hotpink" />
      </RoundedBox>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function RoundedBoxDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="RoundedBox" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


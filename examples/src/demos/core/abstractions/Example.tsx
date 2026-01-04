import { Canvas } from '@react-three/fiber'
import { Example, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Example Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Example counter component - click to increment */}
      <Example font="/fonts/helvetiker_regular.typeface.json" color="hotpink" position={[0, 0, 0]} />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function ExampleDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Example" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


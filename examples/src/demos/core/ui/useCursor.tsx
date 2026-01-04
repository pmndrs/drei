import { Canvas } from '@react-three/fiber'
import { useCursor, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useState } from 'react'

//* useCursor Demo ==============================

function InteractiveMesh() {
  const [hovered, setHovered] = useState(false)
  
  // useCursor changes cursor on hover
  useCursor(hovered)

  return (
    <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'orange' : 'hotpink'} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <InteractiveMesh />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseCursorDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useCursor" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


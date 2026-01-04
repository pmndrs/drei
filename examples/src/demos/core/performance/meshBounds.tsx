import { Canvas } from '@react-three/fiber'
import { meshBounds, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useState } from 'react'

//* meshBounds Demo ==============================

function Scene() {
  const [clicked, setClicked] = useState(false)

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mesh with bounds-based raycasting (faster) */}
      <mesh raycast={meshBounds} onClick={() => setClicked(!clicked)}>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial color={clicked ? 'orange' : 'hotpink'} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function MeshBoundsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="meshBounds" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


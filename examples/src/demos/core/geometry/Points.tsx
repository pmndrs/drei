import { Canvas } from '@react-three/fiber'
import { Points, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import * as THREE from 'three'

//* Points Demo ==============================

function Scene() {
  const pointsArray = new Float32Array(1000 * 3)
  for (let i = 0; i < 1000; i++) {
    pointsArray[i * 3] = (Math.random() - 0.5) * 5
    pointsArray[i * 3 + 1] = (Math.random() - 0.5) * 5
    pointsArray[i * 3 + 2] = (Math.random() - 0.5) * 5
  }

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Point cloud */}
      <Points positions={pointsArray} stride={3}>
        <pointsMaterial size={0.05} color="hotpink" sizeAttenuation />
      </Points>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />
    </>
  )
}

export default function PointsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Points" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


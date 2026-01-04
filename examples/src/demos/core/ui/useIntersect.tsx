import { Canvas } from '@react-three/fiber'
import { useIntersect, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useState } from 'react'

//* useIntersect Demo ==============================

function IntersectingMesh() {
  const [visible, setVisible] = useState(false)

  // useIntersect detects when object is in view
  const ref = useIntersect((isVisible) => setVisible(isVisible))

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={visible ? 'hotpink' : 'gray'} />
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

      <IntersectingMesh />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseIntersectDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useIntersect" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


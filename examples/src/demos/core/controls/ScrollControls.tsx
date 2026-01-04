import { Canvas } from '@react-three/fiber'
import { ScrollControls, useScroll, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

//* ScrollControls Demo ==============================

function ScrollingContent() {
  const scroll = useScroll()
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!groupRef.current) return
    // Move objects based on scroll position
    groupRef.current.position.y = -scroll.offset * 10
  })

  return (
    <group ref={groupRef}>
      {/* Multiple sections that scroll */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={i} position={[0, i * 3, 0]}>
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color={`hsl(${i * 60}, 70%, 60%)`} />
          </mesh>
          <mesh position={[3, 0, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={`hsl(${i * 60 + 30}, 70%, 60%)`} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <ScrollingContent />

      {/* Grid */}
      <gridHelper args={[20, 20, '#666', '#444']} />
    </>
  )
}

export default function ScrollControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ScrollControls" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [5, 5, 5] }}>
          <ScrollControls pages={5} distance={1}>
            <Scene />
          </ScrollControls>
        </Canvas>
      </div>
    </div>
  )
}

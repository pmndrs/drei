import { Canvas, useFrame } from '@react-three/fiber'
import { Trail, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'
import * as THREE from 'three'

//* Trail Demo ==============================

function MovingSphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(clock.getElapsedTime()) * 2
      meshRef.current.position.y = Math.cos(clock.getElapsedTime() * 1.5) * 1
    }
  })

  return (
    <Trail width={0.5} length={20} color="hotpink" attenuation={(t) => t * t}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Trail>
  )
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <MovingSphere />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function TrailDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Trail" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


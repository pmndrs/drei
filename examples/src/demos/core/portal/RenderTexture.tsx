import { Canvas, createPortal, useFrame } from '@react-three/fiber'
import { RenderTexture, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'
import * as THREE from 'three'

//* RenderTexture Demo ==============================

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.5, 0.2, 64, 16]} />
      <meshStandardMaterial color="hotpink" />
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

      {/* Mesh with render texture */}
      <mesh>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial>
          <RenderTexture attach="map">
            <color attach="background" args={['#333']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <RotatingBox />
          </RenderTexture>
        </meshStandardMaterial>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function RenderTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="RenderTexture" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


import { useFrame } from '@react-three/fiber'
import { AsciiRenderer, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'
import * as THREE from 'three'

//* AsciiRenderer Demo ==============================

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
      <torusKnotGeometry args={[1, 0.3, 128, 16]} />
      <meshStandardMaterial color="white" />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <RotatingBox />

      <AsciiRenderer />
    </>
  )
}

export default function AsciiRendererDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="AsciiRenderer" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}


import { ThreeElements, useFrame } from '@react-three/fiber'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { RenderTexture, OrbitControls, PerspectiveCamera } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef, useState } from 'react'
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
      <directionalLight position={[10, 10, 5]} intensity={5} />

      <Cube />
      <Dodecahedron position={[0, 1, 0]} scale={0.2} />
      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function RenderTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="RenderTexture" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <color attach="background" args={['#FFFFFF']} />
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

function Cube() {
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial>
        <RenderTexture attach="map" anisotropy={16}>
          <PerspectiveCamera makeDefault manual aspect={1 / 1} position={[0, 0, 5]} />
          <color attach="background" args={['orange']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />

          <Dodecahedron />
        </RenderTexture>
      </meshStandardMaterial>
    </mesh>
  )
}

function Dodecahedron(props: ThreeElements['group']) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
    }
  })
  return (
    <group {...props}>
      <mesh
        ref={meshRef}
        scale={clicked ? 1.5 : 1}
        onClick={() => click(!clicked)}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <dodecahedronGeometry args={[0.75]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : '#5de4c7'} />
      </mesh>
    </group>
  )
}

import { Canvas } from '@react-three/fiber'
import { MotionPathControls, useMotion } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

//* MotionPathControls Demo ==============================

function AnimatedCamera() {
  const motion = useMotion()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 0.002) % 1)
    }, 16)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    motion.current = progress
  }, [progress, motion])

  return null
}

function Scene() {
  // Create a curved path
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5, 1, 0),
    new THREE.Vector3(-2, 3, 2),
    new THREE.Vector3(0, 2, 5),
    new THREE.Vector3(2, 3, 2),
    new THREE.Vector3(5, 1, 0),
    new THREE.Vector3(2, 1, -2),
    new THREE.Vector3(0, 2, -5),
    new THREE.Vector3(-2, 1, -2),
    new THREE.Vector3(-5, 1, 0),
  ])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Motion Path */}
      <MotionPathControls curves={[curve]} debug damping={0.2} focus={[0, 1, 0]}>
        <AnimatedCamera />
      </MotionPathControls>

      {/* Center object to look at */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {/* Static objects */}
      <mesh position={[2, 0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <mesh position={[-2, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[20, 20, '#666', '#444']} />
    </>
  )
}

export default function MotionPathControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="MotionPathControls" />

      <div className="demo-canvas">
        <Canvas>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


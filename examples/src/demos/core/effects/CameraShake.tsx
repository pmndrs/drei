import { Canvas, useFrame } from '@react-three/fiber'
import { CameraShake, OrbitControls, PerspectiveCamera } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'
import * as THREE from 'three'

//* CameraShake Demo ==============================

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
      <boxGeometry args={[1, 1, 1]} />
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

      <RotatingBox />

      <CameraShake
        maxYaw={0.1} // Max amount camera can yaw in either direction
        maxPitch={0.05} // Max amount camera can pitch in either direction
        maxRoll={0.05} // Max amount camera can roll in either direction
        yawFrequency={0.05} // Frequency of the the yaw rotation
        pitchFrequency={0.2} // Frequency of the pitch rotation
        rollFrequency={0.2} // Frequency of the roll rotation
        intensity={1} // initial intensity of the shake
        decayRate={0.65} // if decay = true this is the rate at which intensity will reduce at />
      />
      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CameraShakeDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CameraShake" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}

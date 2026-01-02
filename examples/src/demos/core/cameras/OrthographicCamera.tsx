import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { OrthographicCamera } from '@react-three/drei/core'

//* OrthographicCamera Demo ==============================

export default function OrthographicCameraDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>OrthographicCamera</h2>
        <p>Orthographic camera with no perspective distortion. Great for isometric views and technical drawings.</p>
      </div>

      <div className="demo-canvas">
        <Canvas>
          <AnimatedOrthoCamera />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Test Objects */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>

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
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          {/* Grid */}
          <gridHelper args={[10, 10, '#666', '#444']} />
        </Canvas>
      </div>
    </div>
  )
}

//* Animated Camera Component ==============================

function AnimatedOrthoCamera() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null)

  useFrame((state) => {
    if (cameraRef.current) {
      cameraRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 5
      cameraRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.3) * 5
      cameraRef.current.lookAt(0, 0, 0)
    }
  })

  return <OrthographicCamera ref={cameraRef} makeDefault position={[5, 5, 5]} zoom={100} near={0.1} far={1000} />
}

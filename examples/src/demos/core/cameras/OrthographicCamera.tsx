import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrthographicCamera } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import ExampleCard from '../../../components/ExampleCard'

//* OrthographicCamera Demo ==============================

export default function OrthographicCameraDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="OrthographicCamera" />

      <div className="demo-canvas">
        <CanvasWithToggle>
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
        </CanvasWithToggle>
      </div>
    </div>
  )
}

//* Animated Camera Component ==============================

function AnimatedOrthoCamera({ doAnimation = true }: { doAnimation?: boolean }) {
  const cameraRef = useRef<THREE.OrthographicCamera>(null)

  const animation = useFrame((state) => {
    if (cameraRef.current) {
      cameraRef.current.position.x = Math.sin(state.elapsed * 0.3) * 5
      cameraRef.current.position.z = Math.cos(state.elapsed * 0.3) * 5
      cameraRef.current.lookAt(0, 0, 0)
    }
  })

  useEffect(() => {
    if (doAnimation) {
      animation.resume()
    } else {
      animation.pause()
    }
  }, [doAnimation])

  return <OrthographicCamera ref={cameraRef} makeDefault position={[5, 5, 5]} zoom={100} near={0.1} far={1000} />
}

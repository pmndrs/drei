import { useFrame } from '@react-three/fiber'
import { KeyboardControls, useKeyboardControls, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'
import * as THREE from 'three'

//* KeyboardControls Demo ==============================

enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
}

function Player() {
  const ref = useRef<THREE.Mesh>(null!)
  const [, get] = useKeyboardControls<Controls>()

  useFrame((state, delta) => {
    const { forward, back, left, right, jump } = get()
    const speed = 5 * delta

    if (forward) ref.current.position.z -= speed
    if (back) ref.current.position.z += speed
    if (left) ref.current.position.x -= speed
    if (right) ref.current.position.x += speed
    if (jump && ref.current.position.y === 0.5) ref.current.position.y = 2

    // Apply gravity
    if (ref.current.position.y > 0.5) {
      ref.current.position.y -= 9.8 * delta
      if (ref.current.position.y < 0.5) ref.current.position.y = 0.5
    }
  })

  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Player />

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
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[10, 10, '#666', '#444']} />
    </>
  )
}

export default function KeyboardControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="KeyboardControls" />

      <div className="demo-canvas">
        <KeyboardControls
          map={[
            { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
            { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
            { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
            { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
            { name: Controls.jump, keys: ['Space'] },
          ]}
        >
          <CanvasWithToggle camera={{ position: [0, 5, 8] }}>
            <OrbitControls makeDefault />
            <Scene />
          </CanvasWithToggle>
        </KeyboardControls>
      </div>
    </div>
  )
}


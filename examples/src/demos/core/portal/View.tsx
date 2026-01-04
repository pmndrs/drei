import { createPortal, useFrame } from '@react-three/fiber'
import { View, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'

//* View Demo ==============================

function RotatingBox({ color }: { color: string }) {
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
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function ViewDemo() {
  const view1Ref = useRef<HTMLDivElement>(null)
  const view2Ref = useRef<HTMLDivElement>(null)

  return (
    <div className="demo-container">
      <ExampleCard demoName="View" />

      <div className="demo-canvas" style={{ display: 'flex', gap: '10px' }}>
        <div ref={view1Ref} style={{ width: '50%', height: '100%', background: '#111' }} />
        <div ref={view2Ref} style={{ width: '50%', height: '100%', background: '#111' }} />

        <CanvasWithToggle eventSource={document.getElementById('root')!}>
          <View track={view1Ref}>
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <RotatingBox color="hotpink" />
            <gridHelper args={[5, 5]} />
          </View>

          <View track={view2Ref}>
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <RotatingBox color="orange" />
            <gridHelper args={[5, 5]} />
          </View>
        </CanvasWithToggle>
      </div>
    </div>
  )
}

import { Canvas } from '@react-three/fiber'
import { useAspect, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* useAspect Demo ==============================

function Scene() {
  // useAspect maintains aspect ratio
  const scale = useAspect(1920, 1080, 1)

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Box scaled by aspect ratio */}
      <mesh scale={scale}>
        <planeGeometry args={[2, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseAspectDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useAspect" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


import { AdaptiveDpr, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* AdaptiveDpr Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Many objects to stress performance */}
      {Array.from({ length: 50 }, (_, i) => (
        <mesh key={i} position={[((i % 10) - 4.5) * 1, Math.floor(i / 10) * 1 - 2, Math.sin(i) * 2]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      ))}

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />

      {/* Adaptive DPR adjusts pixel ratio based on performance */}
      <AdaptiveDpr pixelated />
    </>
  )
}

export default function AdaptiveDprDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="AdaptiveDpr" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 8], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

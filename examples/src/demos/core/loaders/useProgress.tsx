import { useProgress, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* useProgress Demo ==============================

function LoadingIndicator() {
  const { progress } = useProgress()

  return (
    <group>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {progress < 100 && (
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="orange" />
        </mesh>
      )}
    </group>
  )
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <LoadingIndicator />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseProgressDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useProgress" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

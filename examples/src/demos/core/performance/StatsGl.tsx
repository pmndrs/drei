import { StatsGl, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* StatsGl Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference objects */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[((i % 5) - 2) * 1.5, Math.floor(i / 5) * 1.5 - 0.5, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      ))}

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />

      {/* WebGL Stats panel */}
      <StatsGl />
    </>
  )
}

export default function StatsGlDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="StatsGl" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

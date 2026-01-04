import { Grid, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Grid Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {/* Infinite grid */}
      <Grid infiniteGrid cellSize={0.5} cellThickness={0.5} sectionSize={2} sectionThickness={1} fadeDistance={30} />
    </>
  )
}

export default function GridDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Grid" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [5, 5, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

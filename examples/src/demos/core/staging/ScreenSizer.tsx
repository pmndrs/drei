import { ScreenSizer, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* ScreenSizer Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* ScreenSizer scales based on screen size */}
      <ScreenSizer>
        <mesh>
          <boxGeometry args={[100, 100, 100]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </ScreenSizer>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function ScreenSizerDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ScreenSizer" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

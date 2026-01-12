import { ScreenSpace, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* ScreenSpace Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference object in 3D space */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" wireframe />
      </mesh>

      {/* ScreenSpace objects render in screen space */}
      <ScreenSpace depth={1}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial color="orange" />
        </mesh>
      </ScreenSpace>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function ScreenSpaceDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ScreenSpace" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [3, 3, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

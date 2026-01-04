import { Mask, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Mask Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mask shape */}
      <Mask id={1} colorWrite={false} depthWrite={false}>
        <sphereGeometry args={[0.8, 32, 32]} />
      </Mask>

      {/* Masked objects */}
      <mesh>
        <boxGeometry args={[2, 2, 0.2]} />
        <meshStandardMaterial color="hotpink" />
        <Mask id={1} inverse />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function MaskDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Mask" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

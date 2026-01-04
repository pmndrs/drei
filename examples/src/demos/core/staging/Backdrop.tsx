import { Backdrop, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Backdrop Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.3} />

      {/* Spotlight pointing down - targets (0,0,0) by default so no rotation needed */}
      <spotLight
        position={[0, 3, 1]}
        intensity={10}
        angle={0.5}
        penumbra={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <mesh position={[0, 0.3, 0.2]} scale={0.2} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#097D7D" />
      </mesh>

      {/* Backdrop plane */}
      <Backdrop floor={2} segments={20} receiveShadow scale={[4, 1, 1]}>
        <meshStandardMaterial color="#ffffff" />
      </Backdrop>
    </>
  )
}

export default function BackdropDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Backdrop" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 1, 2], fov: 50 }} shadows={'percentage'}>
          <color attach="background" args={['#111111']} />
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

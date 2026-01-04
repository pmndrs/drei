import { Center, OrbitControls, Text3D } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Center Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Center component */}
      <Center>
        <Text3D font="/fonts/helvetiker_regular.typeface.json" size={0.5} height={0.2}>
          drei
          <meshStandardMaterial color="hotpink" />
        </Text3D>
      </Center>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CenterDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Center" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

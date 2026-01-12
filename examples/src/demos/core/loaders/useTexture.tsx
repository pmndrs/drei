import { useTexture, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* useTexture Demo ==============================

function TexturedMesh() {
  const texture = useTexture('https://threejs.org/examples/textures/crate.gif')

  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <TexturedMesh />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useTexture" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

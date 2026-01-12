import { MatcapTexture, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* MatcapTexture Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />

      {/* Mesh with matcap material */}
      <mesh>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshMatcapMaterial>
          <MatcapTexture id={7} />
        </meshMatcapMaterial>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function MatcapTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="MatcapTexture" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

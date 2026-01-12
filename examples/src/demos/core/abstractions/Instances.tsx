import { Instances, Instance, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Instances Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Instanced rendering - efficient for many objects */}
      <Instances limit={1000}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="hotpink" />

        {Array.from({ length: 100 }, (_, i) => (
          <Instance
            key={i}
            position={[((i % 10) - 4.5) * 0.5, Math.floor(i / 10) * 0.5 - 2, Math.sin(i * 0.5) * 2]}
            rotation={[i * 0.1, i * 0.2, 0]}
            scale={0.5 + Math.sin(i) * 0.3}
          />
        ))}
      </Instances>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />
    </>
  )
}

export default function InstancesDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Instances" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 8], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

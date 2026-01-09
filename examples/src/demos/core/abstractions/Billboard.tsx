import { Billboard, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { DoubleSide } from 'three'

//* Billboard Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Billboard planes that always face camera */}
      <Billboard position={[-2, 0, 0]}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </Billboard>

      <Billboard position={[0, 1, 0]}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="orange" side={DoubleSide} />
        </mesh>
      </Billboard>

      <Billboard position={[2, 0, 0]}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="lightblue" side={DoubleSide} />
        </mesh>
      </Billboard>

      {/* Reference objects */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function BillboardDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Billboard" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [3, 3, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

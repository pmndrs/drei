import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { Detailed, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Detailed Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* LOD system - different meshes at different distances */}
      <Detailed distances={[0, 10, 20]}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="hotpink" wireframe />
        </mesh>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="orange" wireframe />
        </mesh>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="lightblue" wireframe />
        </mesh>
      </Detailed>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function DetailedDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Detailed" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 5, 25], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

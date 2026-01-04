import { Fisheye, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Fisheye Demo ==============================

function Scene() {
  return (
    <>
      {/* Fisheye effect */}
      <Fisheye zoom={0}>
        <OrbitControls />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Objects */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>

        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        <mesh position={[-2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>

        <gridHelper args={[10, 10, '#444', '#333']} position={[0, -1, 0]} />
      </Fisheye>
    </>
  )
}

export default function FisheyeDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Fisheye" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

import { BBAnchor, OrbitControls, Text } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* BBAnchor Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference mesh */}
      <mesh>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color="hotpink" wireframe />
      </mesh>

      {/* BBAnchor positions text relative to bounding box */}
      <BBAnchor anchor={[0, 1, 0]}>
        <Text position={[0, 0.2, 0]} fontSize={0.25} color="white">
          Top
        </Text>
      </BBAnchor>

      <BBAnchor anchor={[0, -1, 0]}>
        <Text position={[0, -0.2, 0]} fontSize={0.25} color="white">
          Bottom
        </Text>
      </BBAnchor>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function BBAnchorDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="BBAnchor" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

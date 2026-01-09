import { useTexture } from '@react-three/fiber'
import { Decal, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Decal Demo ==============================

function Scene() {
  const reactTexture = useTexture('/images/react.png')
  const threeTexture = useTexture('/images/three.png')
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mesh with decal projected onto it */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="lightblue" />
        <Decal position={[0, 0, 1]} rotation={[0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
          <meshBasicMaterial
            map={reactTexture}
            polygonOffset
            depthTest={false}
            polygonOffsetFactor={-2}
            transparent
            opacity={0.8}
          />
        </Decal>
        <Decal position={[0, 0.3, 1]} debug rotation={[-0.2, 0, 0]} scale={[0.8, 0.8, 0.8]}>
          <meshBasicMaterial map={threeTexture} polygonOffset polygonOffsetFactor={-1} transparent opacity={0.8} />
        </Decal>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function DecalDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Decal" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

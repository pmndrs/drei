import { Clone, OrbitControls, useGLTF } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Clone Demo ==============================

function Scene() {
  const { scene } = useGLTF('https://threejs.org/examples/models/gltf/Parrot.glb')

  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Multiple clones of the same geometry */}
      <Clone object={scene} position={[-2, 0, 0]} scale={0.05} />
      <Clone object={scene} position={[0, 0, 0]} scale={0.05} rotation={[0, Math.PI / 2, 0]} />
      <Clone object={scene} position={[2, 0, 0]} scale={0.05} rotation={[0, Math.PI, 0]} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -1, 0]} />
    </>
  )
}

export default function CloneDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Clone" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 2, 15], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

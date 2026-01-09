import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { Edges, OrbitControls } from '@react-three/drei'
//import { Edges as EdgesWebGPU } from '@react-three/drei/webgpu'
import { ExampleCard } from '../../../components/ExampleCard'
//import { PlatformSwitch } from '@ex/components/PlatformSwitch'

//* Edges Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mesh with edge rendering */}
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="hotpink" />
        <Edges color="white" threshold={15} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function EdgesDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Edges" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

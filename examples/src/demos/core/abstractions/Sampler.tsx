import { Canvas } from '@react-three/fiber'
import { Sampler, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Sampler Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Sampler samples points on a mesh surface */}
      <Sampler count={1000}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" wireframe />

        <instancedMesh args={[undefined, undefined, 1000]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="orange" />
        </instancedMesh>
      </Sampler>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function SamplerDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Sampler" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


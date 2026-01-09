import { Sampler, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef } from 'react'
import { InstancedMesh } from 'three'

//* Sampler Demo ==============================

function Scene() {
  const instancesRef = useRef<InstancedMesh>(null)
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Sampler samples points on a mesh surface */}
      <Sampler count={1000} instances={instancesRef}>
        <mesh>
          <torusKnotGeometry args={[1, 0.4, 100, 16]} />
          <meshStandardMaterial color="hotpink" wireframe />
        </mesh>
        <instancedMesh ref={instancesRef} args={[undefined, undefined, 1000]}>
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
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }} renderer>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

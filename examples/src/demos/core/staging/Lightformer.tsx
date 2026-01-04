import { Lightformer, OrbitControls, Environment } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Lightformer Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Environment with lightformers */}
      <Environment>
        <Lightformer
          intensity={0.75}
          color="white"
          position={[0, 5, 0]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={0.5}
          color="hotpink"
          position={[-5, 0, -1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[10, 2, 1]}
        />
        <Lightformer
          intensity={0.5}
          color="orange"
          position={[5, 0, -1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[10, 2, 1]}
        />
      </Environment>

      {/* Reflective sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="white" metalness={1} roughness={0} />
      </mesh>
    </>
  )
}

export default function LightformerDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Lightformer" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

import { Canvas } from '@react-three/fiber'
import { ScreenQuad } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* ScreenQuad Demo ==============================

function Scene() {
  return (
    <>
      {/* Fullscreen quad */}
      <ScreenQuad>
        <meshBasicMaterial color="hotpink" transparent opacity={0.5} />
      </ScreenQuad>

      {/* Reference objects behind the quad */}
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </>
  )
}

export default function ScreenQuadDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ScreenQuad" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


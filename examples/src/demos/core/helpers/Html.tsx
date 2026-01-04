import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Html Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* HTML overlay on 3D object */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
        <Html center>
          <div style={{ background: 'white', padding: '10px', borderRadius: '5px', pointerEvents: 'none' }}>
            <strong>Box</strong>
          </div>
        </Html>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function HtmlDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Html" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


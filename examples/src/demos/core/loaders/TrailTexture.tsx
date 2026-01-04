import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* TrailTexture Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function TrailTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="TrailTexture" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> TrailTexture creates dynamic trail textures.
            <br />
            See Trail demo for usage example.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


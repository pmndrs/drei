import { Canvas } from '@react-three/fiber'
import { WebcamVideoTexture, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* WebcamVideoTexture Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Webcam texture on mesh */}
      <mesh>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial>
          <WebcamVideoTexture />
        </meshBasicMaterial>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function WebcamVideoTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="WebcamVideoTexture" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> WebcamVideoTexture requires webcam permission.
            <br />
            Allow camera access when prompted.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


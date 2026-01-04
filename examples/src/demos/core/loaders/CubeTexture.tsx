import { Canvas } from '@react-three/fiber'
import { CubeTexture, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* CubeTexture Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Mesh with cube texture environment map */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" metalness={1} roughness={0} />
        <CubeTexture />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CubeTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CubeTexture" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> CubeTexture requires cube map images.
            <br />
            See documentation for setup details.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


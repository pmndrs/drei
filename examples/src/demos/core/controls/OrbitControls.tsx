import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core'

//* OrbitControls Demo ==============================

export default function OrbitControlsDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>OrbitControls</h2>
        <p>
          Mouse-based orbit controls for camera manipulation.
          <br />
          <br />
          <strong>Controls:</strong>
          <br />• Left Mouse: Rotate
          <br />• Right Mouse: Pan
          <br />• Scroll: Zoom
        </p>
      </div>

      <div className="demo-canvas">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#ff6b6b" intensity={0.5} />

          {/* Test Object */}
          <mesh>
            <torusKnotGeometry args={[1, 0.3, 128, 32]} />
            <meshStandardMaterial color="hotpink" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#222" />
          </mesh>

          {/* Grid */}
          <gridHelper args={[20, 20, '#444', '#333']} position={[0, -2, 0]} />
        </Canvas>
      </div>
    </div>
  )
}

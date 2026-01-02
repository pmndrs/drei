import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei/core'

//* PerspectiveCamera Demo ==============================

export default function PerspectiveCameraDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>PerspectiveCamera</h2>
        <p>
          Standard perspective camera with depth and field of view. Most commonly used camera type for
          3D scenes. Use mouse to orbit.
        </p>
      </div>

      <div className="demo-canvas">
        <Canvas>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <OrbitControls makeDefault />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Test Objects */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>

          <mesh position={[2, 0.5, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="orange" />
          </mesh>

          <mesh position={[-2, 0.5, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshStandardMaterial color="lightblue" />
          </mesh>

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          {/* Grid */}
          <gridHelper args={[10, 10, '#666', '#444']} />
        </Canvas>
      </div>
    </div>
  )
}

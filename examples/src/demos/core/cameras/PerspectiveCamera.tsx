import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'

//* PerspectiveCamera Demo ==============================

export default function PerspectiveCameraDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>PerspectiveCamera</h2>
        <p>
          Standard perspective camera with depth and field of view. Most commonly used camera type for 3D scenes. Use
          mouse to orbit.
        </p>
      </div>

      <div className="demo-canvas">
        <Canvas>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <OrbitControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}

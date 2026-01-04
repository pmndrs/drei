import { PerspectiveCamera, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
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
        <CanvasWithToggle>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <OrbitControls makeDefault />

          <CommonScene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

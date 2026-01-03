import { Canvas } from '@react-three/fiber'
import { DeviceOrientationControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* DeviceOrientationControls Demo ==============================

export default function DeviceOrientationControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="DeviceOrientationControls" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 5, 5] }}>
          <DeviceOrientationControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}


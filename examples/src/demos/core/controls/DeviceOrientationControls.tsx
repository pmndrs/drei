import { DeviceOrientationControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* DeviceOrientationControls Demo ==============================

export default function DeviceOrientationControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="DeviceOrientationControls" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 5, 5] }}>
          <DeviceOrientationControls makeDefault />

          <CommonScene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

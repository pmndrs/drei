import { PointerLockControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function PointerLockControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="PointerLockControls" />

      <div className="demo-canvas">
        <CanvasWithToggle renderer camera={{ position: [0, 5, 5] }}>
          <PointerLockControls makeDefault />

          <CommonScene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

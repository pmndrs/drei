import { FirstPersonControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* FirstPersonControls Demo ==============================

export default function FirstPersonControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="FirstPersonControls" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 2, 5] }}>
          <FirstPersonControls makeDefault movementSpeed={5} lookSpeed={0.1} />

          <CommonScene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}


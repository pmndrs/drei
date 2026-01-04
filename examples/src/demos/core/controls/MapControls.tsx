import { MapControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function MapControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="MapControls" />

      <div className="demo-canvas">
        <CanvasWithToggle renderer camera={{ position: [0, 5, 5] }}>
          <MapControls makeDefault />

          <CommonScene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

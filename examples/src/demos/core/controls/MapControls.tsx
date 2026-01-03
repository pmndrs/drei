import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function MapControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="MapControls" />

      <div className="demo-canvas">
        <Canvas renderer camera={{ position: [0, 5, 5] }}>
          <MapControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}

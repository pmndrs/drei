import { Canvas } from '@react-three/fiber'
import { FlyControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function FlyControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="FlyControls" />

      <div className="demo-canvas">
        <Canvas renderer camera={{ position: [0, 5, 5] }}>
          <FlyControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}

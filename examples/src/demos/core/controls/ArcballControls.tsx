import { Canvas } from '@react-three/fiber'
import { ArcballControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function ArcballControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ArcballControls" />

      <div className="demo-canvas">
        <Canvas renderer camera={{ position: [0, 5, 5] }}>
          <ArcballControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}

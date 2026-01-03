import { Canvas } from '@react-three/fiber'
import { TrackballControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function TrackballControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="TrackballControls" />

      <div className="demo-canvas">
        <Canvas renderer camera={{ position: [0, 5, 5] }}>
          <TrackballControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}

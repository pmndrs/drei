import { Canvas } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei/core'
import CommonScene from '../../shared/CommonScene'
import { ExampleCard } from '../../../components/ExampleCard'

//* PerspectiveCamera Demo ==============================

export default function PointerLockControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="PointerLockControls" />

      <div className="demo-canvas">
        <Canvas renderer camera={{ position: [0, 5, 5] }}>
          <PointerLockControls makeDefault />

          <CommonScene />
        </Canvas>
      </div>
    </div>
  )
}

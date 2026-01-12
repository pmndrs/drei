import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { OrbitControls } from '@react-three/drei/core'
import { Line } from '@react-three/drei/legacy'
import { Line as WebGPIULine } from '@react-three/drei/webgpu'
import { ExampleCard } from '../../../components/ExampleCard'
import * as THREE from 'three'
import { PlatformSwitch } from '@ex/components/PlatformSwitch'

//* Line Demo ==============================

function Scene() {
  const points = [
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(-2, 0, 0),
  ]

  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Line rendering */}
      <PlatformSwitch
        legacy={<Line points={points} color="hotpink" lineWidth={3} />}
        webgpu={<WebGPIULine points={points} color="hotpink" lineWidth={3} />}
      />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -3, 0]} />
    </>
  )
}

export default function LineDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Line" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

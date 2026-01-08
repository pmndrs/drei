import { OrbitControls, useEnvironment } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

//* useEnvironment Demo ==============================

function Scene() {
  const presetTexture = useEnvironment({ preset: 'city' })
  const { scene } = useThree()
  useEffect(() => {
    scene.background = presetTexture
    scene.environment = presetTexture
  }, [presetTexture])
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="white" metalness={1} roughness={0} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseEnvironmentDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useEnvironment" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

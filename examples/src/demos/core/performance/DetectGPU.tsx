import { DetectGPU, Html, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* DetectGPU Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />

      {/* GPU detection */}
      <DetectGPU>
        {({ device, fps, gpu, isMobile, tier, type }) => (
          <Html maxWidth={600}>
            | device {device} fps {fps} | gpu {gpu} isMobile {isMobile?.toString()} | Tier {tier.toString()} Type {type}{' '}
            |
          </Html>
        )}
      </DetectGPU>
    </>
  )
}

export default function DetectGPUDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="DetectGPU" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

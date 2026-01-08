import { OrbitControls } from '@react-three/drei'
import { Stars as WebGLStars } from '@react-three/drei/legacy'
import { Stars as WebGPUStars } from '@react-three/drei/webgpu'
import { CanvasWithToggle, PlatformSwitch } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Stars Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Starfield - platform-specific implementation */}
      <PlatformSwitch
        legacy={<WebGLStars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
        webgpu={<WebGPUStars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      />

      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </>
  )
}

export default function StarsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Stars" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <color attach="background" args={['#000']} />
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

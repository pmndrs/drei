import { OrbitControls } from '@react-three/drei'
import { Cloud as WebGLCloud } from '@react-three/drei/legacy'
import { Cloud as WebGPUCloud } from '@react-three/drei/webgpu'
import { ExampleCard } from '../../../components/ExampleCard'
import { CanvasWithToggle, PlatformSwitch } from '@ex/components/PlatformSwitch'

//* Cloud Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Bilboard clouds */}
      <PlatformSwitch
        legacy={
          <WebGLCloud position={[0, 0, 0]} segments={20} bounds={[3, 2, 2]} volume={6} color="white" fade={100} />
        }
        webgpu={
          <WebGPUCloud position={[0, 0, 0]} segments={20} bounds={[3, 2, 2]} volume={6} color="white" fade={100} />
        }
      />

      {/* Ground reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CloudDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Cloud" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 8], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

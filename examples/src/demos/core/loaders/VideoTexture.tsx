import { VideoTexture, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* VideoTexture Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Video texture on mesh */}
      <mesh>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial>
          <VideoTexture src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
        </meshBasicMaterial>
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function VideoTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="VideoTexture" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

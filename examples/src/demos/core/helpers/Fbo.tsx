import { OrbitControls, Fbo } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* Fbo Demo ==============================

function Scene() {
  const fbo = Fbo({ width: 256, height: 256 })

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Display FBO as texture */}
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={fbo.texture} />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function FboDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Fbo" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}


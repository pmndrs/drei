import { Canvas } from '@react-three/fiber'
import { SpriteAnimator, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* SpriteAnimator Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Animated sprite */}
      <SpriteAnimator
        position={[0, 0, 0]}
        startFrame={0}
        autoPlay
        loop
        numberOfFrames={8}
        alphaTest={0.01}
        textureImageURL="/sprites/example.png"
        textureDataURL="/sprites/example.json"
      />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function SpriteAnimatorDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="SpriteAnimator" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> SpriteAnimator requires sprite texture and data files.
            <br />
            See documentation for setup details.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


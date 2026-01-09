import { SpriteAnimator, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
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
        frameName="Fly"
        fps="18"
        scale={1.5}
        startFrame={0}
        endFrame={5}
        autoPlay
        loop
        flipX={false}
        numberOfFrames={6}
        alphaTest={0.01}
        asSprite={true}
        textureImageURL="/sprites/story.png"
        textureDataURL="/sprites/story.json"
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
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

import { useAnimations, OrbitControls, useGLTF } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useEffect } from 'react'

//* useAnimations Demo ==============================

function AnimatedModel() {
  const { scene, animations } = useGLTF('https://threejs.org/examples/models/gltf/Parrot.glb')
  const { actions } = useAnimations(animations, scene)

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAnimation = Object.values(actions)[0]
      firstAnimation?.play()
    }
  }, [actions])

  return <primitive object={scene} scale={0.5} />
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <AnimatedModel />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -1, 0]} />
    </>
  )
}

export default function UseAnimationsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useAnimations" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 2, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}


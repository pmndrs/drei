import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* useGLTF Demo ==============================

function Model() {
  const { scene } = useGLTF('https://threejs.org/examples/models/gltf/Parrot.glb')

  return <primitive object={scene} scale={0.5} />
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Model />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -1, 0]} />
    </>
  )
}

export default function UseGLTFDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useGLTF" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


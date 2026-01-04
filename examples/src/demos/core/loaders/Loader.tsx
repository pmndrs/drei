import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* Loader Demo ==============================

export default function LoaderDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Loader" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>

          <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
        </Canvas>

        {/* Loader UI overlay */}
        <Loader />
      </div>
    </div>
  )
}


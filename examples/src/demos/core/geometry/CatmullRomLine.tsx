import { Canvas } from '@react-three/fiber'
import { CatmullRomLine, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* CatmullRomLine Demo ==============================

function Scene() {
  const points = [
    [-2, 0, 0],
    [-1, 1, 0],
    [0, 0, 0],
    [1, -1, 0],
    [2, 0, 0],
  ]

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Smooth Catmull-Rom curve */}
      <CatmullRomLine points={points} color="hotpink" lineWidth={3} />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CatmullRomLineDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CatmullRomLine" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


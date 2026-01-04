import { Canvas } from '@react-three/fiber'
import { ComputedAttribute, OrbitControls } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'

//* ComputedAttribute Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* ComputedAttribute example */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial vertexColors />
        
        <ComputedAttribute
          name="color"
          compute={(geometry) => {
            const count = geometry.attributes.position.count
            const colors = new Float32Array(count * 3)
            for (let i = 0; i < count; i++) {
              colors[i * 3] = Math.random()
              colors[i * 3 + 1] = Math.random()
              colors[i * 3 + 2] = Math.random()
            }
            return colors
          }}
        />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function ComputedAttributeDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ComputedAttribute" />

      <div className="demo-canvas">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


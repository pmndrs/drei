import { Canvas } from '@react-three/fiber'
import { CurveModifier, OrbitControls, Line } from '@react-three/drei/core'
import { ExampleCard } from '../../../components/ExampleCard'
import * as THREE from 'three'

//* CurveModifier Demo ==============================

// Note: CurveModifier is complex and requires specific setup
// This is a placeholder demonstration

function Scene() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(-1, 1, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, -1, 0),
    new THREE.Vector3(2, 0, 0),
  ])

  const points = curve.getPoints(50)

  return (
    <>
      <OrbitControls makeDefault />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Show the curve path */}
      <Line points={points} color="hotpink" lineWidth={2} />

      {/* Reference object */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[0.2, 0.2, 2]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CurveModifierDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CurveModifier" />

      <div className="demo-canvas">
        <div style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> CurveModifier requires complex setup.
            <br />
            Showing curve path reference. See documentation for full implementation.
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}


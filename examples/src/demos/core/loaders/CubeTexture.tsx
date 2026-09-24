import { CubeTexture, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* CubeTexture Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* CubeTexture loads the six faces and hands the texture to its children */}
      <CubeTexture
        files={['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']}
        path="https://threejs.org/examples/textures/cube/Park3Med/"
      >
        {(texture) => (
          <>
            <primitive object={texture} attach="background" />
            <mesh>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial envMap={texture} metalness={1} roughness={0} />
            </mesh>
          </>
        )}
      </CubeTexture>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function CubeTextureDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="CubeTexture" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

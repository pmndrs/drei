import { OrbitControls } from '@react-three/drei/core'
import { ContactShadows } from '@react-three/drei/webgpu'
import { ContactShadows as ContactShadowsLegacy } from '@react-three/drei/legacy'
import { CanvasWithToggle, PlatformSwitch } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

//* ContactShadows Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <spotLight intensity={0.5} angle={0.1} penumbra={1} position={[10, 15, 10]} castShadow />

      {/* Floating objects to cast shadows */}
      {/* Objects float above Y=0, shadows positioned below at Y=-0.01 */}
      <mesh position={[-1.5, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <mesh position={[1.5, 0.5, 0]} castShadow>
        <torusKnotGeometry args={[0.35, 0.12, 128, 32]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>

      {/* Contact shadows - position at ground level, capture objects up to 'far' units above */}
      {/* Similar setup to the shoe configurator example */}
      <PlatformSwitch
        legacy={
          <ContactShadowsLegacy
            position={[0, -0.01, 0]}
            opacity={0.4}
            scale={10}
            blur={1.5}
            far={1.5}
            resolution={256}
            color="#000000"
          />
        }
        webgpu={
          <ContactShadows position={[0, -0.01, 0]} opacity={1} scale={10} blur={1.5} far={1.5} resolution={256} />
        }
      />

      {/* Ground plane - position at Y=0 */}
    </>
  )
}

export default function ContactShadowsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="ContactShadows" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 4, 6], fov: 50 }}>
          <color attach="background" args={['#FFFFFF']} />
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

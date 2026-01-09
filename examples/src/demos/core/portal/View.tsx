import { ThreeElements } from '@react-three/fiber'
import {
  View,
  OrbitControls,
  useGLTF,
  PerspectiveCamera,
  OrthographicCamera,
  Bounds,
  Html,
  Center,
  PivotControls,
  Environment,
  ArcballControls,
} from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function useHover() {
  const [hovered, hover] = useState(false)
  return [hovered, { onPointerOver: () => hover(true), onPointerOut: () => hover(false) }] as const
}

type GroupProps = ThreeElements['group']

interface SodaProps extends GroupProps {
  wireframe?: boolean
}

export function Soda({ wireframe, ...props }: SodaProps) {
  const [hovered, spread] = useHover()
  const { nodes } = useGLTF('/models/bottle.gltf')
  return (
    <group {...props} {...spread} dispose={null}>
      <mesh geometry={(nodes.Mesh_sodaBottle as THREE.Mesh).geometry}>
        <meshStandardMaterial
          color={hovered ? 'red' : 'green'}
          roughness={0}
          metalness={0.8}
          envMapIntensity={2}
          wireframe={wireframe}
        />
      </mesh>
      <mesh geometry={(nodes.Mesh_sodaBottle_1 as THREE.Mesh).geometry}>
        <meshStandardMaterial color="black" envMapIntensity={0} wireframe={wireframe} />
      </mesh>
    </group>
  )
}

//* View Demo ==============================

export default function ViewDemo() {
  const containerRef = useRef<HTMLDivElement>(null!)
  return (
    <div className="demo-container">
      <ExampleCard demoName="View" />

      {/* Container wraps both Views and Canvas - Views overlay the canvas via absolute positioning */}
      <div ref={containerRef} className="demo-canvas" style={{ position: 'relative', height: '600px' }}>
        <Outer />
        <CanvasWithToggle
          eventSource={containerRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
        >
          <View.Port />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

export function Outer() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%', height: '100%' }}>
      <View index={1} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
        <color attach="background" args={['#fed200']} />
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <Lights preset="lobby" />
        <Soda scale={3} position={[0, -0.75, 0]} />
        <OrbitControls makeDefault />
      </View>
      <View index={2} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
        <color attach="background" args={['#feabda']} />
        <Lights preset="city" />
        <OrthographicCamera makeDefault position={[0, 0, 4]} zoom={100} />
        <Bounds fit clip observe>
          <Soda scale={3} position={[0, -0.75, 0]} />
        </Bounds>
        <ArcballControls makeDefault />
      </View>
      <View index={3} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
        <color attach="background" args={['#bbfeeb']} />
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <Lights preset="dawn" />
        <Soda scale={3} position={[0, -0.75, 0]} />
        <Html>
          <p style={{ color: '#fed200' }}>this is html</p>
        </Html>
        <OrbitControls makeDefault />
      </View>
      <View index={4} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
        <color attach="background" args={['#d6edf3']} />
        <PerspectiveCamera makeDefault position={[-1, 1, 1]} fov={25} />
        <Lights preset="warehouse" />
        <OrbitControls makeDefault />
        <PivotControls depthTest={false} scale={0.15} anchor={[0, 0, 0]}>
          <Center>
            <Soda wireframe />
          </Center>
        </PivotControls>
      </View>
    </div>
  )
}

function Lights({ preset }: { preset: React.ComponentProps<typeof Environment>['preset'] }) {
  return (
    <>
      <ambientLight intensity={1} />
      <pointLight position={[20, 30, 10]} />
      <pointLight position={[-10, -10, -10]} color="blue" />
      <Environment preset={preset} />
    </>
  )
}

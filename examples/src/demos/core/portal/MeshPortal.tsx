import { useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Edges, CameraControls, Environment, PivotControls } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

import { MeshPortalMaterial } from '@react-three/drei/legacy'

const MeshPortalDemo = () => (
  <Canvas shadows camera={{ position: [-3, 0.5, 3] }}>
    <PivotControls anchor={[-1.1, -1.1, -1.1]} scale={0.75} lineWidth={3.5}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <Edges />
        <Side rotation={[0, 0, 0]} bg="orange" index={0}>
          <torusGeometry args={[0.65, 0.3, 64]} />
        </Side>
        <Side rotation={[0, Math.PI, 0]} bg="lightblue" index={1}>
          <torusKnotGeometry args={[0.55, 0.2, 128, 32]} />
        </Side>
        <Side rotation={[0, Math.PI / 2, Math.PI / 2]} bg="lightgreen" index={2}>
          <boxGeometry args={[1.15, 1.15, 1.15]} />
        </Side>
        <Side rotation={[0, Math.PI / 2, -Math.PI / 2]} bg="aquamarine" index={3}>
          <octahedronGeometry />
        </Side>
        <Side rotation={[0, -Math.PI / 2, 0]} bg="indianred" index={4}>
          <icosahedronGeometry />
        </Side>
        <Side rotation={[0, Math.PI / 2, 0]} bg="hotpink" index={5}>
          <dodecahedronGeometry />
        </Side>
      </mesh>
    </PivotControls>
    <CameraControls makeDefault />
  </Canvas>
)

type SideProps = {
  rotation?: [number, number, number]
  bg?: string
  children: ReactNode
  index: number
}

function Side({ rotation = [0, 0, 0], bg = '#f0f0f0', children, index }: SideProps) {
  const mesh = useRef<THREE.Mesh>(null!)
  const { worldUnits } = useControls({ worldUnits: false })
  const { nodes } = useGLTF('/models/aobox-transformed.glb')
  const cube = nodes.Cube as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
  useFrame((_, delta) => {
    mesh.current.rotation.x = mesh.current.rotation.y += delta
  })
  return (
    // @ts-expect-error - `resolution` is optional at runtime (the component defaults it), but the legacy
    // `portalMaterialImpl` element declares it required, so no prop set satisfies PortalProps. Same as its story.
    <MeshPortalMaterial worldUnits={worldUnits} attach={`material-${index}`}>
      {/** Everything in here is inside the portal and isolated from the canvas */}
      <ambientLight intensity={0.5} />
      <Environment preset="city" />
      {/** A box with baked AO */}
      <mesh castShadow receiveShadow rotation={rotation} geometry={cube.geometry}>
        <meshStandardMaterial aoMapIntensity={1} aoMap={cube.material.aoMap} color={bg} />
        <spotLight
          castShadow
          color={bg}
          intensity={200}
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          shadow-normalBias={0.05}
          shadow-bias={0.0001}
        />
      </mesh>
      {/** The shape */}
      <mesh castShadow receiveShadow ref={mesh}>
        {children}
        <meshLambertMaterial color={bg} />
      </mesh>
    </MeshPortalMaterial>
  )
}

export default MeshPortalDemo

import * as React from 'react'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'
import { Mesh, Vector3 } from 'three'

import { useThree } from '@react-three/fiber'
import { Setup } from '@sb/Setup'
import { Edges, useGLTF, PivotControls, Environment } from 'drei'
import { Line as LegacyLine } from '@legacy/Geometry/Line'
import { Line as WebGPULine } from '@webgpu/Geometry/Line'
import { MeshPortalMaterial } from './MeshPortalMaterial'
import { MeshPortalMaterial as MeshPortalMaterialWebGPU } from '../../../webgpu/Materials/MeshPortalMaterial'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

export default {
  title: 'Shaders/MeshPortalMaterial',
  tags: ['dual'],
  component: MeshPortalMaterial,
  args: {
    worldUnits: false,
  },
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(-3, 0.5, 3)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshPortalMaterial>

type Story = StoryObj<typeof MeshPortalMaterial>

interface SideProps {
  rotation?: [number, number, number]
  bg?: string
  index: number
  children: React.ReactNode
  worldUnits?: boolean
  PortalMaterial: typeof MeshPortalMaterial
}

function Side({ rotation = [0, 0, 0], bg = '#f0f0f0', children, index, worldUnits, PortalMaterial }: SideProps) {
  const mesh = useRef<Mesh>(null!)
  const { nodes } = useGLTF('/aobox-transformed.glb')
  useFrame((_state, delta) => {
    mesh.current.rotation.x = mesh.current.rotation.y += delta
  })
  return (
    // @ts-expect-error - resolution is optional at runtime, handled by component defaults
    <PortalMaterial worldUnits={worldUnits} attach={`material-${index}`}>
      <ambientLight intensity={0.5} />
      <Environment preset="city" />
      <mesh castShadow receiveShadow rotation={rotation} geometry={(nodes.Cube as Mesh).geometry}>
        {/* @ts-expect-error - material.aoMap exists on MeshStandardMaterial loaded from glb */}
        <meshStandardMaterial aoMapIntensity={1} aoMap={(nodes.Cube as Mesh).material.aoMap} color={bg} />
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
      <mesh castShadow receiveShadow ref={mesh}>
        {children}
        <meshLambertMaterial color={bg} />
      </mesh>
    </PortalMaterial>
  )
}

function useLineComponent() {
  const renderer = useThree((state) => state.renderer)
  const isWebGPU = 'backend' in renderer
  return (isWebGPU ? WebGPULine : LegacyLine) as any
}

function MeshPortalScene({
  worldUnits,
  PortalMaterial,
}: {
  worldUnits: boolean
  PortalMaterial: typeof MeshPortalMaterial
}) {
  const LineComponent = useLineComponent()
  return (
    <PivotControls anchor={[-1.1, -1.1, -1.1]} scale={0.75} LineComponent={LineComponent}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <Edges />
        <Side rotation={[0, 0, 0]} bg="orange" index={0} worldUnits={worldUnits} PortalMaterial={PortalMaterial}>
          <torusGeometry args={[0.65, 0.3, 64]} />
        </Side>
        <Side
          rotation={[0, Math.PI, 0]}
          bg="lightblue"
          index={1}
          worldUnits={worldUnits}
          PortalMaterial={PortalMaterial}
        >
          <torusKnotGeometry args={[0.55, 0.2, 128, 32]} />
        </Side>
        <Side
          rotation={[0, Math.PI / 2, Math.PI / 2]}
          bg="lightgreen"
          index={2}
          worldUnits={worldUnits}
          PortalMaterial={PortalMaterial}
        >
          <boxGeometry args={[1.15, 1.15, 1.15]} />
        </Side>
        <Side
          rotation={[0, Math.PI / 2, -Math.PI / 2]}
          bg="aquamarine"
          index={3}
          worldUnits={worldUnits}
          PortalMaterial={PortalMaterial}
        >
          <octahedronGeometry />
        </Side>
        <Side
          rotation={[0, -Math.PI / 2, 0]}
          bg="indianred"
          index={4}
          worldUnits={worldUnits}
          PortalMaterial={PortalMaterial}
        >
          <icosahedronGeometry />
        </Side>
        <Side
          rotation={[0, Math.PI / 2, 0]}
          bg="hotpink"
          index={5}
          worldUnits={worldUnits}
          PortalMaterial={PortalMaterial}
        >
          <dodecahedronGeometry />
        </Side>
      </mesh>
    </PivotControls>
  )
}

export const MeshPortalMaterialSt = {
  render: (args) => (
    <PlatformSwitch
      legacy={<MeshPortalScene worldUnits={args.worldUnits ?? false} PortalMaterial={MeshPortalMaterial} />}
      webgpu={
        <MeshPortalScene
          worldUnits={args.worldUnits ?? false}
          PortalMaterial={MeshPortalMaterialWebGPU as typeof MeshPortalMaterial}
        />
      }
    />
  ),
  name: 'Default',
} satisfies Story

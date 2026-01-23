import * as React from 'react'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { useThree } from '@react-three/fiber'

import { Setup } from '@sb/Setup'
import { PivotControls, Box } from 'drei'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Line as LegacyLine } from '@legacy/Geometry/Line'
import { Line as WebGPULine } from '@webgpu/Geometry/Line'

export default {
  title: 'Gizmos/PivotControls',
  component: PivotControls,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 2.5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof PivotControls>

type Story = StoryObj<typeof PivotControls>

// Hook to get the correct Line component based on renderer type
function useLineComponent() {
  const gl = useThree((state) => state.gl)
  // Check if WebGPU renderer (has 'backend' property)
  const isWebGPU = 'backend' in gl
  return isWebGPU ? WebGPULine : LegacyLine
}

function UsePivotScene(props: React.ComponentProps<typeof PivotControls>) {
  const LineComponent = useLineComponent()
  return (
    <>
      <PivotControls {...props} LineComponent={LineComponent}>
        <Box>
          <meshStandardMaterial />
        </Box>
      </PivotControls>
      <directionalLight position={[10, 10, 5]} />
    </>
  )
}

export const UsePivotSceneSt = {
  args: {
    depthTest: false,
    anchor: [-1, -1, -1],
    scale: 0.75,
  },
  render: (args) => <UsePivotScene {...args} />,
  name: 'Default',
} satisfies Story

function ExternalObjectScene() {
  const LineComponent = useLineComponent()
  const meshRef = React.useRef<THREE.Mesh>(null!)

  return (
    <>
      <PivotControls object={meshRef} depthTest={false} scale={0.75} LineComponent={LineComponent} />
      <mesh ref={meshRef} position={[1, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
      <mesh position={[-1, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="gray" />
      </mesh>
      <directionalLight position={[10, 10, 5]} />
    </>
  )
}

export const ExternalObjectSt = {
  render: () => <ExternalObjectScene />,
  name: 'External Object',
} satisfies Story

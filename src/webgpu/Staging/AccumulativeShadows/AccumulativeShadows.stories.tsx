import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { OrbitControls, Environment } from 'drei'
import { AccumulativeShadows, RandomizedLight } from './AccumulativeShadows'

export default {
  title: 'Staging/AccumulativeShadows (WebGPU)',
  component: AccumulativeShadows,
  // This is the src/webgpu implementation, so it cannot run on the WebGL
  // renderer — pin it rather than letting the toolbar toggle break it.
  decorators: [
    (Story) => (
      <Setup renderer="webgpu" limitedTo="webgpu" cameraPosition={new Vector3(0, 2, 6)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof AccumulativeShadows>

type Story = StoryObj<typeof AccumulativeShadows>

/**
 * Primitives rather than a GLTF: if this renders nothing, the cause should be
 * the component and not an asset that failed to load. Tracked in #2659.
 */
function AccumulativeShadowScene(props: React.ComponentProps<typeof AccumulativeShadows>) {
  return (
    <React.Suspense fallback={null}>
      <color attach="background" args={['goldenrod']} />

      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <torusKnotGeometry args={[0.6, 0.22, 128, 32]} />
        <meshStandardMaterial color="orange" roughness={0.2} metalness={0.1} />
      </mesh>

      <AccumulativeShadows {...props} position={[0, -0.5, 0]}>
        <RandomizedLight amount={8} radius={4} ambient={0.5} bias={0.001} position={[5, 5, -10]} />
      </AccumulativeShadows>

      <OrbitControls autoRotate={false} />
      <Environment preset="city" />
    </React.Suspense>
  )
}

export const AccumulativeShadowSt = {
  name: 'Default',
  render: (args) => <AccumulativeShadowScene {...args} />,
  args: {
    temporal: true,
    frames: 100,
    color: 'goldenrod',
    alphaTest: 0.65,
    opacity: 2,
    scale: 14,
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story

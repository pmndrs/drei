import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { DiscardMaterial } from './DiscardMaterial'

export default {
  title: 'Materials/DiscardMaterial (WebGPU)',
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(0, 3, 8)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta

type DiscardArgs = {
  /** Swap the right-hand knot's material for DiscardMaterial */
  discard: boolean
}

type Story = StoryObj<DiscardArgs>

/**
 * DiscardMaterial is a singleton NodeMaterial that discards every fragment —
 * used to hide a mesh during FBO passes while keeping it in the scene graph.
 * Two identical torus knots: the left one is always visible, the right one is
 * the control. When `discard` is on, the right one should vanish completely.
 */
function DiscardScene({ discard }: DiscardArgs) {
  return (
    <>
      <mesh position={[-2, 0, 0]} castShadow>
        <torusKnotGeometry args={[0.8, 0.28, 128, 32]} />
        <meshStandardMaterial color="orange" roughness={0.3} />
      </mesh>

      <mesh position={[2, 0, 0]} castShadow>
        <torusKnotGeometry args={[0.8, 0.28, 128, 32]} />
        {discard ? (
          <primitive object={DiscardMaterial} attach="material" />
        ) : (
          <meshStandardMaterial color="hotpink" roughness={0.3} />
        )}
      </mesh>
    </>
  )
}

export const DiscardMaterialSt = {
  name: 'Default (right knot discarded)',
  render: (args) => <DiscardScene {...args} />,
  args: { discard: true },
} satisfies Story

export const DiscardMaterialSt2 = {
  name: 'Control (no discard)',
  render: (args) => <DiscardScene {...args} />,
  args: { discard: false },
} satisfies Story

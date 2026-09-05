import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Outlines } from './Outlines'

export default {
  title: 'Effects/Outlines (WebGPU)',
  component: Outlines,
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof Outlines>

type Story = StoryObj<typeof Outlines>

/**
 * Outlines reads its geometry from the parent mesh, so it must be a child of
 * one. A plain box keeps the failure mode unambiguous.
 */
function OutlinesScene(props: React.ComponentProps<typeof Outlines>) {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial />

      <Outlines {...props} />
    </mesh>
  )
}

export const OutlinesSt = {
  name: 'Default',
  render: (args) => <OutlinesScene {...args} />,
  args: {
    thickness: 0.1,
    color: 'hotpink',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story

export const OutlinesSt2 = {
  name: 'Screenspace thickness',
  render: (args) => <OutlinesScene {...args} />,
  args: {
    screenspace: true,
    thickness: 0.02,
    color: '#00ffcc',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story

import React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Outlines } from 'drei'

export default {
  title: 'Effects/Outlines',
  tags: ['experimental'],
  component: Outlines,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new THREE.Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Outlines>

type Story = StoryObj<typeof Outlines>

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
  args: {
    thickness: 0.1,
    color: 'hotpink',
  },
  render: (args) => <OutlinesScene {...args} />,
  name: 'Default',
} satisfies Story

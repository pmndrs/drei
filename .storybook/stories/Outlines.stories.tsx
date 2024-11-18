import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { Outlines } from '../../src'

export default {
  title: 'Abstractions/Outlines',
  component: Outlines,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}>
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

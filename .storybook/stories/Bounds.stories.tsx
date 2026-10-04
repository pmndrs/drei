import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { Bounds } from '../../src'

export default {
  title: 'Staging/Bounds',
  component: Bounds,
  args: {
    fit: true,
    clip: true,
    observe: true,
    margin: 1.2,
  },
  argTypes: {
    fit: { control: 'boolean' },
    clip: { control: 'boolean' },
    observe: { control: 'boolean' },
    margin: { control: { type: 'range', min: 0.5, max: 3, step: 0.1 } },
  },
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Bounds>

type Story = StoryObj<typeof Bounds>

function BoundsScene(props: React.ComponentProps<typeof Bounds>) {
  return (
    <Bounds {...props}>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
      <mesh position={[1.5, 0.5, 0]}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </Bounds>
  )
}

export const BoundsSt = {
  render: (args) => <BoundsScene {...args} />,
  name: 'Default',
} satisfies Story

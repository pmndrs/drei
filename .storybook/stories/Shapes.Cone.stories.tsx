import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Cone } from '@react-three/drei/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Cone',
  component: Cone,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Cone>

type Story = StoryObj<typeof Cone>

function ConeScene(props: React.ComponentProps<typeof Cone>) {
  const ref = useTurntable<React.ComponentRef<typeof Cone>>()

  return (
    <Cone ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Cone>
  )
}

export const ConeSt = {
  args: {},
  render: (args) => <ConeScene {...args} />,
  name: 'Default',
} satisfies Story

import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Cylinder } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Cylinder',
  component: Cylinder,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Cylinder>

type Story = StoryObj<typeof Cylinder>

function CylinderScene(props: React.ComponentProps<typeof Cylinder>) {
  const ref = useTurntable<React.ComponentRef<typeof Cylinder>>()

  return (
    <Cylinder ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Cylinder>
  )
}

export const CylinderSt = {
  args: {},
  render: (args) => <CylinderScene {...args} />,
  name: 'Default',
} satisfies Story

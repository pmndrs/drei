import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Tetrahedron } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Tetrahedron',
  component: Tetrahedron,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Tetrahedron>

type Story = StoryObj<typeof Tetrahedron>

function TetrahedronScene(props: React.ComponentProps<typeof Tetrahedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Tetrahedron>>()

  return (
    <Tetrahedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Tetrahedron>
  )
}

export const TetrahedronSt = {
  args: {},
  render: (args) => <TetrahedronScene {...args} />,
  name: 'Default',
} satisfies Story

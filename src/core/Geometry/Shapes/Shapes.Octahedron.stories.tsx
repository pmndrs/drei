import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Octahedron } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Octahedron',
  component: Octahedron,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Octahedron>

type Story = StoryObj<typeof Octahedron>

function OctahedronScene(props: React.ComponentProps<typeof Octahedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Octahedron>>()

  return (
    <Octahedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Octahedron>
  )
}

export const OctahedronSt = {
  args: {},
  render: (args) => <OctahedronScene {...args} />,
  name: 'Default',
} satisfies Story

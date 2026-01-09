import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Tetrahedron } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Tetrahedron',
  component: Tetrahedron,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
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

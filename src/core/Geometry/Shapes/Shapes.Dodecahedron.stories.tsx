import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Dodecahedron } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Dodecahedron',
  component: Dodecahedron,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Dodecahedron>

type Story = StoryObj<typeof Dodecahedron>

function DodecahedronScene(props: React.ComponentProps<typeof Dodecahedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Dodecahedron>>()

  return (
    <Dodecahedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Dodecahedron>
  )
}

export const DodecahedronSt = {
  args: {},
  render: (args) => <DodecahedronScene {...args} />,
  name: 'Default',
} satisfies Story

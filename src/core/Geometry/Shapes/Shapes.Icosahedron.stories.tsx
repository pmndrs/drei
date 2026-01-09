import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Icosahedron } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Icosahedron',
  component: Icosahedron,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Icosahedron>

type Story = StoryObj<typeof Icosahedron>

function IcosahedronScene(props: React.ComponentProps<typeof Icosahedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Icosahedron>>()

  return (
    <Icosahedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Icosahedron>
  )
}

export const IcosahedronSt = {
  args: {},
  render: (args) => <IcosahedronScene {...args} />,
  name: 'Default',
} satisfies Story

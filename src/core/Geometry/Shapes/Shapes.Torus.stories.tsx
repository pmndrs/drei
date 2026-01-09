import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Torus } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Torus',
  component: Torus,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Torus>

type Story = StoryObj<typeof Torus>

function TorusScene(props: React.ComponentProps<typeof Torus>) {
  const ref = useTurntable<React.ComponentRef<typeof Torus>>()

  return (
    <Torus ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Torus>
  )
}

export const TorusSt = {
  args: {},
  render: (args) => <TorusScene {...args} />,
  name: 'Default',
} satisfies Story

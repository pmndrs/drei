import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Cone } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Cone',
  component: Cone,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
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

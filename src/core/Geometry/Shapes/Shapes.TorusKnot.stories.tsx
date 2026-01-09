import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { TorusKnot } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/TorusKnot',
  component: TorusKnot,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof TorusKnot>

type Story = StoryObj<typeof TorusKnot>

function TorusKnotScene(props: React.ComponentProps<typeof TorusKnot>) {
  const ref = useTurntable<React.ComponentRef<typeof TorusKnot>>()

  return (
    <TorusKnot ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </TorusKnot>
  )
}

export const TorusKnotSt = {
  args: {},
  render: (args) => <TorusKnotScene {...args} />,
  name: 'Default',
} satisfies Story

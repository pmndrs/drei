import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Box } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Box',
  component: Box,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Box>

type Story = StoryObj<typeof Box>

function BoxScene(props: React.ComponentProps<typeof Box>) {
  const ref = useTurntable<React.ComponentRef<typeof Box>>()

  return (
    <Box ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Box>
  )
}

export const BoxSt = {
  args: {},
  render: (args) => <BoxScene {...args} />,
  name: 'Default',
} satisfies Story

import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Box, FlyControls } from '@react-three/drei'

export default {
  title: 'Controls/FlyControls',
  component: FlyControls,
  decorators: [
    (Story) => (
      <Setup controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof FlyControls>

type Story = StoryObj<typeof FlyControls>

function FlyControlsScene(props: React.ComponentProps<typeof FlyControls>) {
  return (
    <>
      <FlyControls {...props} />
      <Box>
        <meshBasicMaterial wireframe />
      </Box>
    </>
  )
}

export const FlyControlsSt = {
  render: ({ ...args }) => <FlyControlsScene {...args} />,
  args: {
    autoForward: false,
    dragToLook: false,
    movementSpeed: 1.0,
    rollSpeed: 0.005,
  },
  name: 'Default',
} satisfies Story

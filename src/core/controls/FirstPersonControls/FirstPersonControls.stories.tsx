import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Box, FirstPersonControls } from 'drei'

export default {
  title: 'Controls/FirstPersonControls',
  component: FirstPersonControls,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof FirstPersonControls>

type Story = StoryObj<typeof FirstPersonControls>

function FirstPersonControlsScene(props: React.ComponentProps<typeof FirstPersonControls>) {
  return (
    <>
      <FirstPersonControls {...props} />
      <Box>
        <meshBasicMaterial wireframe />
      </Box>
    </>
  )
}

export const FirstPersonControlsSt = {
  render: ({ ...args }) => <FirstPersonControlsScene {...args} />,
  args: {
    activeLook: true,
    autoForward: false,
    constrainVertical: false,
    enabled: true,
    heightCoef: 1,
    heightMax: 1,
    heightMin: 0,
    heightSpeed: false,
    lookVertical: true,
    lookSpeed: 0.005,
    movementSpeed: 1,
    verticalMax: Math.PI,
    verticalMin: 0,
  },
  name: 'Default',
} satisfies Story

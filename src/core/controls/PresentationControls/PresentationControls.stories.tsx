import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Box, PresentationControls } from 'drei'

export default {
  title: 'Controls/PresentationControls',
  component: PresentationControls,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} camera={{ near: 1, far: 1100, fov: 75 }} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof PresentationControls>

type Story = StoryObj<typeof PresentationControls>

function PresentationControlScene(props: React.ComponentProps<typeof PresentationControls>) {
  return (
    <PresentationControls {...props}>
      <Box args={[1, 1, 1]}>
        <meshBasicMaterial wireframe />
        <axesHelper args={[100]} />
      </Box>
    </PresentationControls>
  )
}

export const PresentationControlStory = {
  args: {
    global: true,
    snap: true,
    enabled: true,
  },
  render: (args) => <PresentationControlScene {...args} />,
  name: 'Default',
} satisfies Story

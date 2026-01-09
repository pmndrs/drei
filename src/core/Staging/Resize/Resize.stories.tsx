import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Box, Resize } from 'drei'

export default {
  title: 'Staging/Resize',
  component: Resize,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} camera={{ position: [1, 1, 1], zoom: 150 }} orthographic>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Resize>

type Story = StoryObj<typeof Resize>

function ResizeScene(props: React.ComponentProps<typeof Resize>) {
  return (
    <>
      <Resize {...props}>
        <Box args={[70, 40, 20]}>
          <meshBasicMaterial wireframe />
        </Box>
      </Resize>

      <axesHelper />
    </>
  )
}

export const ResizeSt = {
  argTypes: {
    width: { control: { type: 'boolean' } },
    height: { control: { type: 'boolean' } },
    depth: { control: { type: 'boolean' } },
  },
  render: (args) => <ResizeScene {...args} />,
  name: 'Default',
} satisfies Story

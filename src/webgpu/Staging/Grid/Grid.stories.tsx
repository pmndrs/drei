import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Grid, Box } from 'drei'

export default {
  title: 'Staging/Grid',
  component: Grid,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(-5, 5, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Grid>

type Story = StoryObj<typeof Grid>

function GridScene(props: React.ComponentProps<typeof Grid>) {
  return (
    <React.Suspense fallback={null}>
      <Grid {...props} />
      <Box position={[0, 0.5, 0]}>
        <meshStandardMaterial />
      </Box>
      <directionalLight position={[10, 10, 5]} />
    </React.Suspense>
  )
}

export const GridSt = {
  render: (args) => <GridScene {...args} />,
  args: {
    cellColor: 'white',
    args: [10, 10],
  },
  name: 'Default',
} satisfies Story

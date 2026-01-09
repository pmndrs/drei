import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { DeviceOrientationControls, Box } from '../../src'

export default {
  title: 'Controls/DeviceOrientationControls',
  component: DeviceOrientationControls,
  decorators: [
    (Story) => (
      <Setup camera={{ near: 1, far: 1100, fov: 75 }} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof DeviceOrientationControls>

type Story = StoryObj<typeof DeviceOrientationControls>

function DeviceOrientationControlsScene(props: React.ComponentProps<typeof DeviceOrientationControls>) {
  return (
    <>
      <DeviceOrientationControls {...props} />

      <Box args={[100, 100, 100, 4, 4, 4]}>
        <meshBasicMaterial wireframe />
        <axesHelper args={[100]} />
      </Box>
    </>
  )
}

export const DeviceOrientationControlsSt = {
  name: 'Default',
  render: (args) => <DeviceOrientationControlsScene {...args} />,
} satisfies Story

import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { Box } from '../../src'
import FPVCamera from '../../src/web/FPVCamera'

export default {
  title: 'Controls/FPVCamera',
  component: FPVCamera,
  decorators: [
    (Story) => (
      <Setup camera={{ near: 0.1, far: 1000, fov: 75 }} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof FPVCamera>

type Story = StoryObj<typeof FPVCamera>

function FPVCameraScene(props: React.ComponentProps<typeof FPVCamera>) {
  return (
    <>
      <FPVCamera {...props} />

      {/* Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="gray" />
      </mesh>

      {/* Orange Box */}
      <Box args={[1, 1, 1]} position={[0, 1, -5]}>
        <meshStandardMaterial color="orange" />
      </Box>
    </>
  )
}

export const FPVCameraStory = {
  args: {
    rotationSpeed: 0.002,
    height: 1.7,
    moveSpeed: 2,
  },
  render: (args) => <FPVCameraScene {...args} />,
  name: 'Default',
} satisfies Story

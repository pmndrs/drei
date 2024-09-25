/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { FaceLandmarker, FaceControls, Box } from '../../src'
import { ComponentProps } from 'react'

export default {
  title: 'Controls/FaceControls',
  component: FaceControls,
  decorators: [
    (Story) => (
      <Setup cameraFov={60}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof FaceControls>

type Story = StoryObj<typeof FaceControls>

function FaceControlsScene(props: ComponentProps<typeof FaceControls>) {
  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker>
          <FaceControls {...props} />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt = {
  render: (args) => <FaceControlsScene {...args} />,
  name: 'Default',
} satisfies Story

import React from 'react'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { OrbitControls } from '../../src/OrbitControls'
import { Box } from '../../src/shapes'

export function OrbitControlsStory(args) {
  return (
    <>
      <OrbitControls {...args} />
      <Box>
        <meshBasicMaterial attach="material" wireframe />
      </Box>
    </>
  )
}

OrbitControlsStory.storyName = 'Default'

OrbitControlsStory.args = {
  enablePan: true,
  enableZoom: true,
  enableRotate: true,
}

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  decorators: [
    withKnobs,
    (Story) => (
      <Setup controls={false}>
        <Story />
      </Setup>
    ),
  ],
}

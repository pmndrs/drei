import React from 'react'

import { setupDecorator } from '../setup-decorator'

import { DeviceOrientationControls } from '../../src/DeviceOrientationControls'
import { Box } from '../../src/shapes'

export function DeviceOrientationControlsStory() {
  return (
    <>
      <DeviceOrientationControls />
      <Box args={[100, 100, 100, 4, 4, 4]}>
        <meshBasicMaterial attach="material" wireframe />
        <axesHelper args={[100]} />
      </Box>
    </>
  )
}

DeviceOrientationControlsStory.storyName = 'Default'

export default {
  title: 'Controls/DeviceOrientationControls',
  component: DeviceOrientationControls,
  decorators: [setupDecorator()],
}

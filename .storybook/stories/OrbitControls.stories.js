import React from 'react'

import { setupDecorator } from '../setup-decorator'

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

OrbitControlsStory.story = { name: 'Default' }

OrbitControlsStory.args = {
  enablePan: true,
  enableZoom: true,
  enableRotate: true,
}

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  decorators: [
    setupDecorator(),
  ],
}

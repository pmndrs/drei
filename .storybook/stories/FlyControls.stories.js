import React from 'react'

import { setupDecorator } from '../setup-decorator'

import { FlyControls } from '../../src/FlyControls'
import { Box } from '../../src/shapes'

export default {
  title: 'Controls/FlyControls',
  component: FlyControls,
  decorators: [ setupDecorator() ],
}

export function FlyControlsStory(args) {
  return (
    <>
      <FlyControls {...args} />
      <Box material-wireframe />
    </>
  )
}

FlyControlsStory.storyName = 'Default'


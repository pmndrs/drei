import * as React from 'react'
import { withKnobs, number, boolean } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Box, FirstPersonControls } from '../../src'

export function FirstPersonControlsStory() {
  return (
    <>
      <FirstPersonControls
        activeLook={boolean('ActiveLook', true)}
        autoForward={boolean('AutoForward', false)}
        constrainVertical={boolean('ConstrainVertical', false)}
        enabled={boolean('Enabled', true)}
        heightCoef={number('HeightCoef', 1)}
        heightMax={number('HeightMax', 1)}
        heightMin={number('HeightMin', 0)}
        heightSpeed={boolean('HeightSpeed', false)}
        lookVertical={boolean('LookVertical', true)}
        lookSpeed={number('LookSpeed', 0.005)}
        movementSpeed={number('MovementSpeed', 1)}
        verticalMax={number('VerticalMax', Math.PI)}
        verticalMin={number('VerticalMin', 0)}
      />
      <Box>
        <meshBasicMaterial attach="material" wireframe />
      </Box>
    </>
  )
}

FirstPersonControlsStory.storyName = 'Default'

export default {
  title: 'Controls/FirstPersonControls',
  component: FirstPersonControls,
  decorators: [withKnobs, (storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

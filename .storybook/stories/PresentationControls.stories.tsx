import * as React from 'react'

import { Setup } from '../Setup'

import { Box, PresentationControlProps, PresentationControls } from '../../src'

export function PresentationControlStory({ enabled, ...rest }: PresentationControlProps) {
  return (
    <PresentationControls global snap enabled={enabled} {...rest}>
      <Box args={[1, 1, 1]}>
        <meshBasicMaterial wireframe />
        <axesHelper args={[100]} />
      </Box>
    </PresentationControls>
  )
}

PresentationControlStory.storyName = 'Default'
PresentationControlStory.args = {
  enabled: true,
}

export default {
  title: 'Controls/PresentationControls',
  component: PresentationControls,
  decorators: [
    (storyFn) => (
      <Setup camera={{ near: 1, far: 1100, fov: 75 }} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}

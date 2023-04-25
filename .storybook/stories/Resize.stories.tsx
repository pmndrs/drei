import * as THREE from 'three'
import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Box, Resize, ResizeProps } from '../../src'

export default {
  title: 'Staging/Resize',
  component: Resize,
  decorators: [
    withKnobs,
    (storyFn) => (
      <Setup camera={{ position: [1, 1, 1], zoom: 150 }} orthographic>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const ResizeSt = ({ width, height, depth }: ResizeProps) => (
  <>
    <axesHelper />

    <Resize width={width} height={height} depth={depth}>
      <Box args={[70, 40, 20]}>
        <meshBasicMaterial wireframe />
      </Box>
    </Resize>
  </>
)
ResizeSt.args = {
  width: undefined,
  height: undefined,
  depth: undefined,
}

ResizeSt.argTypes = {
  width: { control: { type: 'boolean' } },
  height: { control: { type: 'boolean' } },
  depth: { control: { type: 'boolean' } },
}

ResizeSt.storyName = 'Default'

import * as THREE from 'three'
import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { FaceLandmarker, FaceControls, Box } from '../../src'

export default {
  title: 'Controls/FaceControls',
  component: FaceControls,
  decorators: [withKnobs, (storyFn) => <Setup cameraFov={60}>{storyFn()}</Setup>],
}

export const FaceControlsSt = ({ eyes }) => (
  <>
    <color attach="background" args={['#303030']} />
    <axesHelper />

    <FaceLandmarker>
      <FaceControls eyes={eyes} />
    </FaceLandmarker>

    <Box args={[0.1, 0.1, 0.1]}>
      <meshStandardMaterial />
    </Box>
  </>
)
FaceControlsSt.args = {
  eyes: undefined,
}

FaceControlsSt.argTypes = {
  eyes: { control: { type: 'boolean' } },
}

FaceControlsSt.storyName = 'Default'

/* eslint react-hooks/exhaustive-deps: 1 */
import * as THREE from 'three'
import * as React from 'react'

import { Setup } from '../Setup'

import { FaceLandmarker, FaceControls, Box } from '../../src'

export default {
  title: 'Controls/FaceControls',
  component: FaceControls,
  decorators: [(storyFn) => <Setup cameraFov={60}>{storyFn()}</Setup>],
}

function FaceControlsScene(props) {
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

export const FaceControlsSt = (args) => <FaceControlsScene {...args} />
FaceControlsSt.args = {
  eyes: undefined,
}

FaceControlsSt.argTypes = {
  eyes: { control: { type: 'boolean' } },
}

FaceControlsSt.storyName = 'Default'

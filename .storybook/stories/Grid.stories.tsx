import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { Grid, Box } from '../../src'

export default {
  title: 'Gizmos/Grid',
  component: Grid,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-5, 5, 10)}>{storyFn()}</Setup>],
}

function UseGridScene() {
  return (
    <React.Suspense fallback={null}>
      <Grid cellColor="white" args={[10, 10]} />
      <Box position={[0, 0.5, 0]}>
        <meshStandardMaterial />
      </Box>
      <directionalLight position={[10, 10, 5]} />
    </React.Suspense>
  )
}

export const UseGridSceneSt = () => <UseGridScene />
UseGridSceneSt.story = {
  name: 'Default',
}

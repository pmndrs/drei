import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { PivotControls, Box } from '../../src'

export default {
  title: 'Gizmos/PivotControls',
  component: PivotControls,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 2.5)}>{storyFn()}</Setup>],
}

function UsePivotScene() {
  return (
    <React.Suspense fallback={null}>
      <PivotControls depthTest={false} anchor={[-1, -1, -1]} scale={0.75}>
        <Box>
          <meshStandardMaterial />
        </Box>
      </PivotControls>
      <directionalLight position={[10, 10, 5]} />
    </React.Suspense>
  )
}

export const UsePivotSceneSt = () => <UsePivotScene />
UsePivotSceneSt.story = {
  name: 'Default',
}

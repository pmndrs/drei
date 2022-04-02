import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Box, Center, useGLTF } from '../../src'

export default {
  title: 'Staging/Center',
  component: Center,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, -10)}>{storyFn()}</Setup>],
}

const SimpleExample = () => {
  const { scene } = useGLTF('LittlestTokyo.glb')

  const ref = useTurntable()

  return (
    <Center position={[5, 5, 10]}>
      <Box args={[10, 10, 10]}>
        <meshNormalMaterial wireframe />
      </Box>
      <primitive ref={ref} object={scene} scale={[0.01, 0.01, 0.01]} />
    </Center>
  )
}

export const DefaultStory = () => (
  <React.Suspense fallback={null}>
    <SimpleExample />
  </React.Suspense>
)

DefaultStory.storyName = 'Default'

import * as React from 'react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Billboarded, Plane, Box, Cone, OrbitControls, Text } from '../../src'

export default {
  title: 'Abstractions/Billboarded',
  component: Billboarded,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function BillboardedStory() {
  const follow = boolean('follow', true)
  const lockX = boolean('lockX', false)
  const lockY = boolean('lockY', false)
  const lockZ = boolean('lockZ', false)

  return (
    <>
      <group position={[0.5, 1, 0.5]}>
        <Billboarded follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ}>
          <Text position={[0, 1.05, 0]} fontSize={1} outlineWidth={'5%'} outlineColor="#000000" outlineOpacity={1}>
            box
          </Text>
        </Billboarded>
        <Box>
          <meshStandardMaterial color="red" />
        </Box>
      </group>
      <group position={[-2.5, -3, -1]}>
        <Billboarded follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ}>
          <Text position={[0, 1.05, 0]} fontSize={1} outlineWidth={'5%'} outlineColor="#000000" outlineOpacity={1}>
            cone
          </Text>
        </Billboarded>
        <Cone>
          <meshStandardMaterial color="green" />
        </Cone>
      </group>

      <Billboarded follow={follow} lockX={lockX} lockY={lockY} lockZ={lockZ}>
        <Plane position={[0, 0, -5]} args={[2, 2]}>
          <meshStandardMaterial color="#000066" />
        </Plane>
      </Billboarded>

      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const BillboardedSt = () => <BillboardedStory />
BillboardedSt.storyName = 'Default'

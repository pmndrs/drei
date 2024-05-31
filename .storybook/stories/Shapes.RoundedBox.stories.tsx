import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { RoundedBox } from '../../src'

export default {
  title: 'Shapes/RoundedBox',
  component: RoundedBox,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-30, 30, 30)}>{storyFn()}</Setup>],
}

function RoundedBoxScene({ width, height, depth, ...args }) {
  const ref = useTurntable()

  return (
    <RoundedBox ref={ref} args={[width, height, depth]} {...args}>
      <meshPhongMaterial color="#f3f3f3" wireframe />
    </RoundedBox>
  )
}

export const RoundedBoxSt = (args) => <RoundedBoxScene {...args} />
RoundedBoxSt.storyName = 'Default'
RoundedBoxSt.args = {
  width: 25,
  height: 25,
  depth: 25,
  radius: 1,
  smoothness: 5,
}

function RoundedBoxScene2({ width, height, depth, ...args }) {
  const ref = useTurntable()

  return (
    <>
      <spotLight position={[35, 35, 35]} intensity={2} />
      <RoundedBox ref={ref} args={[width, height, depth]} {...args}>
        <meshPhongMaterial color="#f3f3f3" />
      </RoundedBox>
    </>
  )
}

export const RoundedBoxSt2 = (args) => <RoundedBoxScene2 {...args} />
RoundedBoxSt2.storyName = 'Solid'
RoundedBoxSt2.args = {
  width: 25,
  height: 25,
  depth: 25,
  radius: 8,
  smoothness: 5,
}

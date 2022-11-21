import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { RoundedBox } from '../../src'

export default {
  title: 'Shapes/RoundedBox',
  component: RoundedBox,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(-30, 30, 30)}>{storyFn()}</Setup>],
}

function RoundedBoxScene() {
  const ref = useTurntable()

  return (
    <RoundedBox
      ref={ref}
      args={[number('width', 25), number('height', 25), number('depth', 25)]}
      radius={number('radius', 1)}
      smoothness={number('smoothness', 5)}
    >
      <meshPhongMaterial color="#f3f3f3" wireframe />
    </RoundedBox>
  )
}

export const RoundedBoxSt = () => <RoundedBoxScene />
RoundedBoxSt.storyName = 'Default'

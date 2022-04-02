import * as React from 'react'

import { Setup } from '../Setup'

import { Stars, Plane } from '../../src'

export default {
  title: 'Staging/Stars',
  component: Stars,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function StarsScene() {
  return (
    <>
      <Stars />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const StarsSt = () => <StarsScene />
StarsSt.storyName = 'Default'

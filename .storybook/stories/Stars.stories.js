import React from 'react'

import { setupDecorator } from '../setup-decorator'

import { Stars } from '../../src/Stars'
import { Plane } from '../../src/shapes'

export default {
  title: 'Abstractions/Stars',
  component: Stars,
  decorators: [
    setupDecorator(),
  ],
}

export function StarsScene() {
  return (
    <>
      <Stars />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe attach="material" />
      </Plane>
      <axesHelper />
    </>
  )
}

StarsScene.storyName = 'Default'

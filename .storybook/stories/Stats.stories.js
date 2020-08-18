import React from 'react'

import { setupDecorator } from '../setup-decorator'

import { Stats } from '../../src/Stats'

export default {
  title: 'Misc/Stats',
  component: Stats,
  decorators: [
    setupDecorator(),
  ],
}

export function Scene() {
  return (
    <>
      <axisHelper />
      <Stats />
    </>
  )
}

Scene.storyName = 'Default'

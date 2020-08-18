import React from 'react'

import { Setup } from '../Setup'

import { Stats } from '../../src/Stats'

export default {
  title: 'Misc/Stats',
  component: Stats,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
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

import * as React from 'react'

import { Setup } from '../Setup'

import { StatsGl } from '../../src'

export default {
  title: 'Misc/StatsGl',
  component: StatsGl,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function Scene() {
  return (
    <>
      <axesHelper />
      <StatsGl />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'

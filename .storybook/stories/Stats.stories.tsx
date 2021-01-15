import * as React from 'react'

import { Setup } from '../Setup'

import { Stats } from '../../src'

export default {
  title: 'Misc/Stats',
  component: Stats,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      axisHelper: object
    }
  }
}

function Scene() {
  return (
    <>
      <axisHelper />
      <Stats />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'

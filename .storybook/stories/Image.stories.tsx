import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Image } from '../../src'

export default {
  title: 'Abstractions/Image',
  component: Image,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const ImageTransparentStory = ({ ...args }) => {
  return (
    <React.Suspense fallback={null}>
      <Image url="/images/living-room-1.jpg" scale={[6, 4, 1]} position={[0, 0, 0]} {...args} />
      <Image url="/images/living-room-2.jpg" scale={[4, 4, 1]} position={[2, 2, -1]} {...args} />
      <Image url="/images/living-room-3.jpg" scale={[4, 4, 1]} position={[-2, -2, -1.5]} {...args} />
    </React.Suspense>
  )
}

ImageTransparentStory.args = {
  transparent: true,
  opacity: 0.5,
}

ImageTransparentStory.storyName = 'Transparency'

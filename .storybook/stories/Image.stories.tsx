import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Image, useTexture } from '../../src'

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

function TextureWrapper({ ...args }) {
  const texture = useTexture('/images/living-room-1.jpg')
  const texture2 = useTexture('/images/living-room-3.jpg')

  return (
    <>
      <Image texture={texture} scale={[4, 4, 1]} position={[-2, -2, -1.5]} {...args} />
      <Image texture={texture2} scale={[4, 4, 1]} position={[2, 2, -1]} {...args} />
    </>
  )
}

export const ImageStory = ({ url, ...args }) => {
  return (
    <React.Suspense fallback={null}>
      <TextureWrapper {...args} />
      <Image url={url?.[0] || '/images/living-room-2.jpg'} scale={[6, 4, 1]} position={[0, 0, 0]} {...args} />
    </React.Suspense>
  )
}

ImageStory.args = {
  transparent: true,
  opacity: 0.5,
  url: null,
}

ImageStory.argTypes = {
  url: {
    control: {
      type: 'file',
      accept: ['.png', '.jpg'],
    },
  },
}

ImageStory.storyName = 'Image Basic'

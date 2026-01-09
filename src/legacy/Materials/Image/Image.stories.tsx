import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Image, useTexture } from 'drei'

export default {
  title: 'Materials/Image',
  tags: ['legacyOnly'],
  component: Image,
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        limitedTo={'legacy'}
        controls={false}
        cameraPosition={new Vector3(0, 0, 10)}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Image>

type Story = StoryObj<typeof Image>

function ImageScene({ url, ...props }: React.ComponentProps<typeof Image>) {
  const texture1 = useTexture('/images/living-room-1.jpg')
  const texture2 = useTexture('/images/living-room-3.jpg')

  return (
    <>
      <Image texture={texture1} {...props} position={[-2, -2, -1.5]} scale={[4, 4]} />
      <Image texture={texture2} {...props} position={[2, 2, -1]} scale={[4, 4]} />

      <Image url={url?.[0] || '/images/living-room-2.jpg'} {...props} />
    </>
  )
}

export const ImageSt = {
  render: (args) => <ImageScene {...args} />,
  args: {
    transparent: true,
    opacity: 0.5,
    url: undefined,
    scale: [6, 4],
    position: [0, 0, 0],
  },
  argTypes: {
    url: {
      control: {
        type: 'file',
        accept: ['.png', '.jpg'],
      },
    },
  },

  name: 'Image Basic',
} satisfies Story

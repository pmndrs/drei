import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { useTexture } from 'drei'
import { Image } from './Image'

export default {
  title: 'UI/Image (WebGPU)',
  component: Image,
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        limitedTo="webgpu"
        controls={false}
        cameraPosition={new Vector3(0, 0, 10)}
      >
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof Image>

type Story = StoryObj<typeof Image>

/**
 * Mirrors src/legacy/Materials/Image so the two renderers are comparable, and
 * reuses the existing /images assets rather than an invented URL.
 */
function ImageScene({ url, ...props }: React.ComponentProps<typeof Image>) {
  const texture1 = useTexture('/images/living-room-1.jpg')
  const texture2 = useTexture('/images/living-room-3.jpg')

  return (
    <>
      <Image texture={texture1} {...props} position={[-2, -2, -1.5]} scale={[4, 4]} />
      <Image texture={texture2} {...props} position={[2, 2, -1]} scale={[4, 4]} />

      {/* @ts-expect-error - Storybook file control returns array */}
      <Image url={url?.[0] || '/images/living-room-2.jpg'} {...props} />
    </>
  )
}

export const ImageSt = {
  name: 'Image Basic',
  render: (args) => (
    <React.Suspense fallback={null}>
      <ImageScene {...args} />
    </React.Suspense>
  ),
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
} satisfies Story

export const ImageSt2 = {
  name: 'Zoom / radius / grayscale',
  render: (args) => (
    <React.Suspense fallback={null}>
      <ImageScene {...args} />
    </React.Suspense>
  ),
  args: {
    url: undefined,
    scale: [6, 4],
    zoom: 1.4,
    radius: 0.2,
    grayscale: 1,
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 1, max: 3, step: 0.1 } },
    radius: { control: { type: 'range', min: 0, max: 0.5, step: 0.01 } },
    grayscale: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
} satisfies Story

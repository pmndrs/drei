import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { TrailTexture } from 'drei'

export default {
  title: 'misc/TrailTexture',
  component: TrailTexture,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof TrailTexture>

type Story = StoryObj<typeof TrailTexture>

function TrailTextureScene(props: React.ComponentProps<typeof TrailTexture>) {
  return (
    <>
      <color attach="background" args={['#eee']} />

      <TrailTexture {...props}>
        {([texture, onMove]) => (
          <mesh scale={7} onPointerMove={onMove}>
            <planeGeometry />
            <meshBasicMaterial map={texture} />
          </mesh>
        )}
      </TrailTexture>
    </>
  )
}

export const TextureSceneSt = {
  args: {
    size: 256,
    radius: 0.3,
    maxAge: 750,
  },
  argTypes: {
    size: { control: { type: 'range', min: 64, step: 8 } },
    radius: { control: { type: 'range', min: 0.1, max: 1, step: 0.1 } },
    maxAge: { control: { type: 'range', min: 300, max: 1000, step: 100 } },
  },
  render: (args) => <TrailTextureScene {...args} />,
  name: 'Default',
} satisfies Story

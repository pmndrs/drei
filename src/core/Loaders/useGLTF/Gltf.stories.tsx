import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Gltf } from 'drei'

export default {
  title: 'Loaders/Gltf',
  component: Gltf,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Gltf>

type Story = StoryObj<typeof Gltf>

function GltfScene(props: React.ComponentProps<typeof Gltf>) {
  return <Gltf {...props} />
}

export const GltfSt = {
  args: {
    src: 'suzanne.glb',
  },
  render: (args) => <GltfScene {...args} />,
  name: 'Default',
} satisfies Story

//

function GltfDracoScene(props: React.ComponentProps<typeof Gltf>) {
  return <Gltf {...props} />
}

export const GltfDracoSt = {
  args: {
    src: 'suzanne.glb',
    useDraco: '/draco-gltf/',
  },
  render: (args) => <GltfDracoScene {...args} />,
  name: 'Local Binaries',
} satisfies Story

import * as THREE from 'three'
import * as React from 'react'
import { Suspense } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Plane, ScreenVideoTexture } from '@react-three/drei'

export default {
  title: 'Misc/ScreenVideoTexture',
  component: ScreenVideoTexture,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ScreenVideoTexture>

type Story = StoryObj<typeof ScreenVideoTexture>

function ScreenVideoTextureScene(props: React.ComponentProps<typeof ScreenVideoTexture>) {
  return (
    <Plane args={[4, 2.25]}>
      <Suspense fallback={<meshBasicMaterial color="gray" />}>
        <ScreenVideoTexture {...props}>
          {(texture) => <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />}
        </ScreenVideoTexture>
      </Suspense>
    </Plane>
  )
}

export const ScreenVideoTextureSt = {
  render: (args) => <ScreenVideoTextureScene {...args} />,
  name: 'Default',
} satisfies Story

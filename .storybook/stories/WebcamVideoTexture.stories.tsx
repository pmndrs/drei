import * as THREE from 'three'
import * as React from 'react'
import { Suspense } from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Plane, WebcamVideoTexture } from '../../src'

export default {
  title: 'Misc/WebcamVideoTexture',
  component: WebcamVideoTexture,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof WebcamVideoTexture>

type Story = StoryObj<typeof WebcamVideoTexture>

function WebcamVideoTextureScene(props: React.ComponentProps<typeof WebcamVideoTexture>) {
  return (
    <Plane args={[4, 2.25]}>
      <Suspense fallback={<meshBasicMaterial color="gray" />}>
        <WebcamVideoTexture {...props}>
          {(texture) => <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />}
        </WebcamVideoTexture>
      </Suspense>
    </Plane>
  )
}

export const WebcamVideoTextureSt = {
  render: (args) => <WebcamVideoTextureScene {...args} />,
  name: 'Default',
} satisfies Story

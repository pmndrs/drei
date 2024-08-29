import * as React from 'react'
import { Mesh, Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useGLTF, MatcapTexture } from '../../src'

export default {
  title: 'Staging/MatcapTexture',
  component: MatcapTexture,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 3)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MatcapTexture>

type Story = StoryObj<typeof MatcapTexture>

function MatcapTextureScene(props: React.ComponentProps<typeof MatcapTexture>) {
  const { nodes } = useGLTF('suzanne.glb', true) as any

  return (
    <>
      <color attach="background" args={['#291203']} />

      <mesh geometry={(nodes.Suzanne as Mesh).geometry}>
        <MatcapTexture {...props}>{([texture]) => <meshMatcapMaterial matcap={texture} />}</MatcapTexture>
      </mesh>
    </>
  )
}

export const MatcapTextureSt = {
  args: {
    id: 111,
    format: 1024,
  },
  render: (args) => <MatcapTextureScene {...args} />,
  name: 'Default',
} satisfies Story

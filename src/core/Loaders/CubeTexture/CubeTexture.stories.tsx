import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { CubeTexture, Icosahedron } from 'drei'

export default {
  title: 'Abstractions/CubeTexture',
  component: CubeTexture,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof CubeTexture>

type Story = StoryObj<typeof CubeTexture>

function CubeTextureScene(props: React.ComponentProps<typeof CubeTexture>) {
  return (
    <Icosahedron args={[3, 4]}>
      <CubeTexture {...props}>
        {(texture) => <meshStandardMaterial envMap={texture} roughness={0} metalness={0.9} color="#010101" />}
      </CubeTexture>
    </Icosahedron>
  )
}

export const CubeTextureSceneSt = {
  args: {
    files: ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
    path: 'cube/',
  },
  render: (args) => <CubeTextureScene {...args} />,
  name: 'Default',
} satisfies Story

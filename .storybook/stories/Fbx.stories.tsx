import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { Fbx, useCubeTexture } from '../../src'

export default {
  title: 'Loaders/Fbx',
  component: Fbx,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Fbx>

type Story = StoryObj<typeof Fbx>

function FbxScene(props: React.ComponentProps<typeof Fbx>) {
  const envMap = useCubeTexture(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], { path: 'cube/' })

  return (
    <>
      <color attach="background" args={['#51392c']} />

      <Fbx {...props} material-envMap={envMap} material-reflectivity={1} />
    </>
  )
}

export const UseFBXSceneSt = {
  args: {
    path: 'suzanne/suzanne.fbx',
  },
  render: (args) => <FbxScene {...args} />,
  name: 'Default',
} satisfies Story

import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Billboard, Plane, Box, Cone, OrbitControls, Text, Clone, useGLTF } from 'drei'
import { ComponentProps } from 'react'

export default {
  title: 'Abstractions/Clone',
  component: Clone,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Clone>

type Story = StoryObj<typeof Clone>

const CloneExample = () => {
  const { scene } = useGLTF('https://threejs.org/examples/models/gltf/Parrot.glb')
  return (
    <>
      {/* Multiple clones of the same geometry */}
      <Clone object={scene} position={[-2, 0, 0]} scale={0.05} />
      <Clone object={scene} position={[0, 0, 0]} scale={0.05} rotation={[0, Math.PI / 2, 0]} />
      <Clone object={scene} position={[2, 0, 0]} scale={0.05} rotation={[0, Math.PI, 0]} />
    </>
  )
}

export const CloneSt = {
  render: (args) => <CloneExample {...args} />,
  name: 'Planes',
} satisfies Story

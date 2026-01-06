import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Html, useGLTF, Progress } from 'drei'

export default {
  title: 'Misc/Progress',
  component: Progress,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Progress>

type Story = StoryObj<typeof Progress>

function Shoe() {
  const { nodes } = useGLTF(
    'https://threejs.org/examples/models/gltf/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf'
  )

  return <primitive object={nodes['Shoe']} />
}

function CustomLoader() {
  return (
    <Html center>
      <Progress>{({ progress }) => <span style={{ color: 'white' }}>{progress} % loaded</span>}</Progress>
    </Html>
  )
}

function ProgressScene(_props: React.ComponentProps<typeof Progress>) {
  return (
    <React.Suspense fallback={<CustomLoader />}>
      <Shoe />
    </React.Suspense>
  )
}

export const ProgressSt = {
  render: (args) => <ProgressScene {...args} />,
  name: 'Default',
} satisfies Story

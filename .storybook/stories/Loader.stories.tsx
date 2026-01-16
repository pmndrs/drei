import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Html, useGLTF, Loader } from '@react-three/drei'

export default {
  title: 'Misc/Loader',
  component: Loader,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Loader>

type Story = StoryObj<typeof Loader>

function Helmet() {
  const { nodes } = useGLTF('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf')

  return <primitive object={nodes['node_damagedHelmet_-6514']} />
}

//

function LoaderScene(_props: React.ComponentProps<typeof Loader>) {
  return (
    <React.Suspense
      fallback={
        <Html>
          <Loader />
        </Html>
      }
    >
      <Helmet />
    </React.Suspense>
  )
}

export const LoaderSt = {
  render: (args) => <LoaderScene {...args} />,
  name: 'Default',
} satisfies Story

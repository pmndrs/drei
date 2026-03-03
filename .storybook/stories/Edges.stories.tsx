import * as React from 'react'
import * as THREE from 'three'
import { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { Edges, OrbitControls } from '../../src'

export default {
  title: 'Abstractions/Edges',
  component: Edges,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Edges>

type Story = StoryObj<typeof Edges>

function EdgesScene(props: ComponentProps<typeof Edges>) {
  return (
    <>
      <mesh>
        <torusKnotGeometry args={[0.8, 0.25, 100, 16]} />
        <meshStandardMaterial color="royalblue" />
        <Edges {...props} />
      </mesh>
      <OrbitControls enablePan={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} />
    </>
  )
}

export const EdgesSt = {
  render: (args) => <EdgesScene {...args} />,
  name: 'Default',
  args: {
    threshold: 15,
    color: 'white',
    lineWidth: 1,
  },
} satisfies Story

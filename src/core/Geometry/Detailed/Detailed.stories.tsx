import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Detailed, Icosahedron, OrbitControls } from 'drei'
import { ComponentProps } from 'react'

export default {
  title: 'Abstractions/Detailed',
  component: Detailed,
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 100)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Detailed>

type Story = StoryObj<typeof Detailed>

function DetailedScene(props: ComponentProps<typeof Detailed>) {
  return (
    <>
      <Detailed {...props} distances={[0, 50, 150]}>
        <Icosahedron args={[10, 3]}>
          <meshBasicMaterial color="hotpink" wireframe />
        </Icosahedron>
        <Icosahedron args={[10, 2]}>
          <meshBasicMaterial color="lightgreen" wireframe />
        </Icosahedron>
        <Icosahedron args={[10, 1]}>
          <meshBasicMaterial color="lightblue" wireframe />
        </Icosahedron>
      </Detailed>
      <OrbitControls enablePan={false} enableRotate={false} zoomSpeed={0.5} />
    </>
  )
}

export const DetailedSt = {
  render: (args) => <DetailedScene {...args} />,
  name: 'Default',
} satisfies Story

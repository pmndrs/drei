import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Billboard, Plane, Box, Cone, OrbitControls, Text } from '../../src'
import { ComponentProps } from 'react'

export default {
  title: 'Abstractions/Billboard',
  component: Billboard,
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    follow: true,
    lockX: false,
    lockY: false,
    lockZ: false,
  },
  argTypes: {
    follow: { control: 'boolean' },
    lockX: { control: 'boolean' },
    lockY: { control: 'boolean' },
    lockZ: { control: 'boolean' },
  },
} satisfies Meta<typeof Billboard>

type Story = StoryObj<typeof Billboard>

function BillboardScene1(props: ComponentProps<typeof Billboard>) {
  return (
    <>
      <Billboard {...props} position={[-4, -2, 0]}>
        <Plane args={[3, 2]} material-color="red" />
      </Billboard>
      <Billboard {...props} position={[-4, 2, 0]}>
        <Plane args={[3, 2]} material-color="orange" />
      </Billboard>
      <Billboard {...props} position={[0, 0, 0]}>
        <Plane args={[3, 2]} material-color="green" />
      </Billboard>
      <Billboard {...props} position={[4, -2, 0]}>
        <Plane args={[3, 2]} material-color="blue" />
      </Billboard>
      <Billboard {...props} position={[4, 2, 0]}>
        <Plane args={[3, 2]} material-color="yellow" />
      </Billboard>

      <OrbitControls enablePan={true} zoomSpeed={0.5} />
    </>
  )
}

export const BillboardSt1 = {
  render: (args) => <BillboardScene1 {...args} />,
  name: 'Planes',
} satisfies Story

function BillboardScene2(props: ComponentProps<typeof Billboard>) {
  return (
    <>
      <Billboard {...props} position={[0.5, 2.05, 0.5]}>
        <Text fontSize={1} outlineWidth={'5%'} outlineColor="#000000" outlineOpacity={1}>
          box
        </Text>
      </Billboard>
      <Box position={[0.5, 1, 0.5]}>
        <meshStandardMaterial color="red" />
      </Box>
      <group position={[-2.5, -3, -1]}>
        <Billboard {...props} position={[0, 1.05, 0]}>
          <Text fontSize={1} outlineWidth={'5%'} outlineColor="#000000" outlineOpacity={1}>
            cone
          </Text>
        </Billboard>
        <Cone>
          <meshStandardMaterial color="green" />
        </Cone>
      </group>

      <Billboard {...props} position={[0, 0, -5]}>
        <Plane args={[2, 2]}>
          <meshStandardMaterial color="#000066" />
        </Plane>
      </Billboard>

      <OrbitControls enablePan={true} zoomSpeed={0.5} />
    </>
  )
}

export const BillboardTextStory = {
  render: (args) => <BillboardScene2 {...args} />,
  name: 'Text',
} satisfies Story

import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Text3D, Float, Center } from '../../src'

export default {
  title: 'Abstractions/Text3D',
  component: Text3D,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Text3D>

type Story = StoryObj<typeof Text3D>

function Text3DScene(props: React.ComponentProps<typeof Text3D>) {
  return (
    <Center>
      <Float floatIntensity={5} speed={2}>
        <Text3D {...props}>
          Text 3D
          <meshNormalMaterial />
        </Text3D>
      </Float>
    </Center>
  )
}

export const Text3DSt = {
  args: {
    font: '/fonts/helvetiker_regular.typeface.json',
    bevelEnabled: true,
    bevelSize: 0.05,
  },
  render: (args) => <Text3DScene {...args} />,
  name: 'Default',
} satisfies Story

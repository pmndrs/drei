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
  args: {
    bevelEnabled: true,
    bevelSize: 0.05,
  },
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
  },
  render: (args) => <Text3DScene {...args} />,
  name: 'Default',
} satisfies Story

export const Text3DCustomExtSt = {
  args: {
    font: '/fonts/helvetiker_regular.jsonfont',
  },
  render: (args) => <Text3DScene {...args} />,
  name: 'Custom Extension (JSON)',
} satisfies Story

export const Text3DTtfSt = {
  args: {
    font: '/fonts/lemon-round.ttf',
    ttfLoader: true,
  },
  render: (args) => <Text3DScene {...args} />,
  name: 'TTF',
} satisfies Story

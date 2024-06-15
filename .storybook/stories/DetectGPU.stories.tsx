import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { DetectGPU, Text } from '../../src'

export default {
  title: 'Misc/DetectGPU',
  component: DetectGPU,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 20)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof DetectGPU>

type Story = StoryObj<typeof DetectGPU>

function DetectGPUScene(props: React.ComponentProps<typeof DetectGPU>) {
  return (
    <DetectGPU {...props}>
      {({ device, fps, gpu, isMobile, tier, type }) => (
        <Text maxWidth={200}>
          | device {device} fps {fps} | gpu {gpu} isMobile {isMobile?.toString()} | Tier {tier.toString()} Type {type} |
        </Text>
      )}
    </DetectGPU>
  )
}

export const DetectGPUSt = {
  render: (args) => <DetectGPUScene {...args} />,
  name: 'Default',
} satisfies Story

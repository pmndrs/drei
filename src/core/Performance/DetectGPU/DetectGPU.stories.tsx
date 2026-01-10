import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { DetectGPU } from 'drei'
import { Text } from '../../../legacy/UI/Text/Text'

export default {
  title: 'Performance/DetectGPU',
  component: DetectGPU,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 20)}>
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

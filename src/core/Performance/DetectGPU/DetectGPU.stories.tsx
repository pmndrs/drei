import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

import { DetectGPU } from 'drei'
import { Text as LegacyText } from '../../../legacy/UI/Text/Text'
import { Text as WebGPUText } from '../../../webgpu/UI/Text/Text'

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
      {({ device, fps, gpu, isMobile, tier, type }) => {
        const info = `| device ${device} fps ${fps} | gpu ${gpu} isMobile ${isMobile?.toString()} | Tier ${tier.toString()} Type ${type} |`
        return (
          <PlatformSwitch
            legacy={<LegacyText maxWidth={200}>{info}</LegacyText>}
            webgpu={<WebGPUText maxWidth={200}>{info}</WebGPUText>}
          />
        )
      }}
    </DetectGPU>
  )
}

export const DetectGPUSt = {
  render: (args) => <DetectGPUScene {...args} />,
  name: 'Default',
} satisfies Story

import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Cloud, OrbitControls } from 'drei'
import { ComponentProps } from 'react'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

// Import the WebGPU material factory directly for the webgpu story variant
import { FakeCloudMaterial } from '../../../webgpu/Materials/FakeCloudMaterial'

export default {
  title: 'Effects/Cloud',
  tags: ['dual'],
  component: Cloud,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Cloud>

type Story = StoryObj<typeof Cloud>

function CloudScene(props: ComponentProps<typeof Cloud>) {
  return (
    <>
      <React.Suspense fallback={null}>
        {/* Platform switch: WebGL uses default CloudMaterial, WebGPU uses FakeCloudMaterial */}
        <PlatformSwitch
          legacy={
            <Cloud
              {...props}
              position={[0, 0, 0]}
              segments={20}
              bounds={[3, 2, 2]}
              volume={6}
              color="white"
              fade={100}
            />
          }
          webgpu={
            <Cloud
              {...props}
              position={[0, 0, 0]}
              segments={20}
              bounds={[3, 2, 2]}
              volume={6}
              color="white"
              fade={100}
              materialFactory={FakeCloudMaterial}
            />
          }
        />
      </React.Suspense>
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const CloudSt = {
  render: (args) => <CloudScene {...args} />,
  name: 'Default',
} satisfies Story

import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

import { PerspectiveCamera, OrbitControls } from 'drei'
import { Sparkles } from './Sparkles'
import { Sparkles as SparklesWebGPU } from '@webgpu/Effects/Sparkles'

export default {
  title: 'Staging/Sparkles',
  component: Sparkles,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(1, 1, 1)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Sparkles>

type Story = StoryObj<typeof Sparkles>

function SparklesScene(props: React.ComponentProps<typeof Sparkles>) {
  return (
    <>
      <PlatformSwitch
        legacy={<Sparkles {...props} />}
        webgpu={<SparklesWebGPU {...(props as any)} />}
      />

      <OrbitControls />
      <axesHelper />
      <PerspectiveCamera position={[2, 2, 2]} makeDefault />
    </>
  )
}

export const SparklesSt = {
  args: {
    color: 'orange',
    size: 5,
    opacity: 1,
    count: 100,
    speed: 0.3,
    noise: 1,
  },
  argTypes: {
    color: {
      control: {
        type: 'color',
      },
    },
    count: {
      control: {
        type: 'range',
        min: 0,
        max: 500,
        step: 1,
      },
    },
    noise: {
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    size: {
      control: {
        type: 'range',
        min: 0,
        max: 10,
        step: 1,
      },
    },
    speed: {
      control: {
        type: 'range',
        min: 0,
        max: 20,
        step: 0.1,
      },
    },
    opacity: {
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
  },
  render: (args) => <SparklesScene {...args} />,
  name: 'Default',
} satisfies Story

import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Sparkles, PerspectiveCamera, OrbitControls } from '../../src'

export default {
  title: 'Staging/Sparkles',
  component: Sparkles,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(1, 1, 1)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Sparkles>

type Story = StoryObj<typeof Sparkles>

function SparklesScene(props: React.ComponentProps<typeof Sparkles>) {
  return (
    <>
      <Sparkles {...props} />

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

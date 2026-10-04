import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { GradientTexture, GradientType } from '../../src'

export default {
  title: 'Abstractions/GradientTexture',
  component: GradientTexture,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 3)} lights={false}>
        <Story />
      </Setup>
    ),
  ],
  argTypes: {
    stops: { control: 'object' },
    colors: { control: 'object' },
    type: { control: 'select', options: [GradientType.Linear, GradientType.Radial] },
    size: { control: { type: 'range', min: 64, max: 2048, step: 64 } },
    width: { control: { type: 'range', min: 16, max: 2048, step: 16 } },
    innerCircleRadius: { control: { type: 'range', min: 0, max: 1024, step: 16 } },
  },
} satisfies Meta<typeof GradientTexture>

type Story = StoryObj<typeof GradientTexture>

function GradientTextureScene(props: React.ComponentProps<typeof GradientTexture>) {
  return (
    <mesh>
      <planeGeometry args={[3, 3]} />
      <meshBasicMaterial>
        {/* GradientTexture memoizes its canvas on [stops] only, so remount on any arg
            change to keep the Storybook controls live. */}
        <GradientTexture key={JSON.stringify(props)} {...props} />
      </meshBasicMaterial>
    </mesh>
  )
}

export const GradientTextureLinearSt = {
  render: (args) => <GradientTextureScene {...args} />,

  args: {
    stops: [0, 1],
    colors: ['aquamarine', 'hotpink'],
    size: 1024,
    width: 16,
    type: GradientType.Linear,
    innerCircleRadius: 0,
  },

  name: 'Linear',
} satisfies Story

//

export const GradientTextureRadialSt = {
  render: (args) => <GradientTextureScene {...args} />,

  args: {
    stops: [0, 0.5, 1],
    colors: ['aquamarine', 'hotpink', 'yellow'],
    size: 1024,
    width: 1024,
    type: GradientType.Radial,
    innerCircleRadius: 0,
  },

  name: 'Radial',
} satisfies Story

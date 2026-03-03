import * as React from 'react'
import * as THREE from 'three'
import { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { GradientTexture, OrbitControls } from '../../src'
import { GradientType } from '../../src/core/GradientTexture'

export default {
  title: 'Misc/GradientTexture',
  component: GradientTexture,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 3)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof GradientTexture>

type Story = StoryObj<typeof GradientTexture>

function GradientScene(props: ComponentProps<typeof GradientTexture>) {
  return (
    <>
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial>
          <GradientTexture {...props} />
        </meshBasicMaterial>
      </mesh>
      <OrbitControls enableZoom={false} />
    </>
  )
}

export const LinearSt = {
  render: (args) => <GradientScene {...args} />,
  name: 'Linear',
  args: {
    stops: [0, 0.5, 1],
    colors: ['#f7971e', '#ffd200', '#21d4fd'],
    type: GradientType.Linear,
    size: 1024,
  },
} satisfies Story

export const RadialSt = {
  render: (args) => <GradientScene {...args} />,
  name: 'Radial',
  args: {
    stops: [0, 1],
    colors: ['#21d4fd', '#b721ff'],
    type: GradientType.Radial,
    innerCircleRadius: 0,
    outerCircleRadius: 'auto',
    size: 1024,
  },
} satisfies Story

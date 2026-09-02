import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { GradientTexture, GradientType } from './GradientTexture'

export default {
  title: 'Textures/GradientTexture (WebGPU)',
  component: GradientTexture,
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(0, 0, 6)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof GradientTexture>

type Story = StoryObj<typeof GradientTexture>

/**
 * GradientTexture paints a 2D canvas and attaches it as `map`, so it has to sit
 * inside a material. A plane keeps the gradient unambiguous — anything wrong is
 * the texture, not lighting or geometry.
 */
function GradientScene(props: React.ComponentProps<typeof GradientTexture>) {
  return (
    <mesh>
      <planeGeometry args={[6, 4]} />
      <meshBasicMaterial>
        <GradientTexture {...props} />
      </meshBasicMaterial>
    </mesh>
  )
}

export const GradientTextureSt = {
  name: 'Linear',
  render: (args) => <GradientScene {...args} />,
  args: {
    stops: [0, 0.5, 1],
    colors: ['#e63946', '#f1faee', '#1d3557'],
    size: 1024,
  },
} satisfies Story

export const GradientTextureSt2 = {
  name: 'Radial',
  render: (args) => <GradientScene {...args} />,
  args: {
    stops: [0, 0.5, 1],
    colors: ['#ffd166', '#ef476f', '#073b4c'],
    size: 1024,
    width: 1024,
    type: GradientType.Radial,
    innerCircleRadius: 0,
    outerCircleRadius: 'auto',
  },
} satisfies Story

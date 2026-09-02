import * as React from 'react'
import { IcosahedronGeometry, Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { WireframeMaterial, setBarycentricCoordinates } from './WireframeMaterial'

export default {
  title: 'Materials/WireframeMaterial (WebGPU)',
  component: WireframeMaterial,
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(0, 0, 4)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof WireframeMaterial>

type Story = StoryObj<typeof WireframeMaterial>

/**
 * The material alone, without the <Wireframe /> wrapper: the shader reads a
 * `barycentric` attribute, so the geometry has to be prepared with the exported
 * `setBarycentricCoordinates` helper first.
 */
function WireframeMaterialScene(props: React.ComponentProps<typeof WireframeMaterial>) {
  const geometry = React.useMemo(() => setBarycentricCoordinates(new IcosahedronGeometry(1, 4)), [])

  React.useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry}>
      <WireframeMaterial {...props} />
    </mesh>
  )
}

export const WireframeMaterialSt = {
  name: 'Default',
  render: (args) => <WireframeMaterialScene {...args} />,
  args: {
    stroke: '#ffffff',
    fill: '#1d3557',
    fillOpacity: 0.25,
    fillMix: 1,
    thickness: 0.05,
  },
  argTypes: {
    stroke: { control: 'color' },
    fill: { control: 'color' },
    backfaceStroke: { control: 'color' },
  },
} satisfies Story

export const WireframeMaterialSt2 = {
  name: 'Dashed + squeeze',
  render: (args) => <WireframeMaterialScene {...args} />,
  args: {
    stroke: '#ffffff',
    fill: '#073b4c',
    fillOpacity: 0.2,
    fillMix: 1,
    thickness: 0.04,
    dash: true,
    dashRepeats: 6,
    dashLength: 0.5,
    squeeze: true,
    squeezeMin: 0.1,
    squeezeMax: 1,
  },
  argTypes: {
    stroke: { control: 'color' },
    fill: { control: 'color' },
  },
} satisfies Story

import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Icosahedron } from 'drei'
import { MeshDistortMaterial } from './MeshDistortMaterial'
import { MeshDistortMaterial as MeshDistortMaterialWebGPU } from '../../../webgpu/Materials/MeshDistortMaterial'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

export default {
  title: 'Shaders/MeshDistortMaterial',
  component: MeshDistortMaterial,
  args: {
    color: '#f25042',
    speed: 1,
    distort: 0.6,
    radius: 1,
  },
  argTypes: {
    color: { control: 'color' },
    speed: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    distort: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    radius: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<any>

type Story = StoryObj<any>

function MeshDistortMaterialScene(props: React.ComponentProps<typeof MeshDistortMaterial>) {
  return (
    <Icosahedron args={[1, 4]}>
      {/* @ts-expect-error - TypeScript sees two different DistortMaterialImpl types due to module resolution, but they're compatible at runtime */}
      <PlatformSwitch legacy={<MeshDistortMaterial {...props} />} webgpu={<MeshDistortMaterialWebGPU {...props} />} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialSt = {
  render: (args) => <MeshDistortMaterialScene {...args} />,
  name: 'Default',
} satisfies Story

//

function MeshDistortMaterialRefScene(props: React.ComponentProps<typeof MeshDistortMaterial>) {
  const material = React.useRef<React.ComponentRef<typeof MeshDistortMaterial>>(null!)

  useFrame(({ elapsed }) => {
    material.current.distort = Math.sin(elapsed)
  })

  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial {...props} ref={material} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialRefSt = {
  render: (args) => <MeshDistortMaterialRefScene {...args} />,
  name: 'Ref',
} satisfies Story

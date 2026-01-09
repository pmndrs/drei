import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { MeshWobbleMaterial, Torus } from 'drei'
import { MeshWobbleMaterial as MeshWobbleMaterialWebGPU } from '../../../webgpu/Materials/MeshWobbleMaterial'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

export default {
  title: 'Shaders/MeshWobbleMaterial',
  component: MeshWobbleMaterial,
  args: {
    color: '#f25042',
    speed: 1,
    factor: 0.6,
  },
  argTypes: {
    color: { control: 'color' },
    speed: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    factor: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshWobbleMaterial>

type Story = StoryObj<typeof MeshWobbleMaterial>

function MeshWobbleMaterialScene(props: React.ComponentProps<typeof MeshWobbleMaterial>) {
  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <PlatformSwitch legacy={<MeshWobbleMaterial {...props} />} webgpu={<MeshWobbleMaterialWebGPU {...props} />} />
    </Torus>
  )
}

export const MeshWobbleMaterialSt = {
  render: (args) => <MeshWobbleMaterialScene {...args} />,
  name: 'Default',
} satisfies Story

//

function MeshWobbleMaterialRefScene(props: React.ComponentProps<typeof MeshWobbleMaterial>) {
  const material = React.useRef<React.ComponentRef<typeof MeshWobbleMaterial>>(null)

  useFrame(({ elapsed }) => {
    if (material.current === null) return
    material.current.factor = Math.abs(Math.sin(elapsed)) * 2
  })

  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial {...props} ref={material} />
    </Torus>
  )
}

export const MeshWobbleMaterialRefSt = {
  render: (args) => <MeshWobbleMaterialRefScene {...args} />,
  name: 'Ref',
} satisfies Story

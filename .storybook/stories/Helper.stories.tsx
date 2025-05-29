import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { BoxHelper, CameraHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Helper, PerspectiveCamera, Sphere } from '../../src'
import { Setup } from '../Setup'
import { ComponentProps } from 'react'

export default {
  title: 'Gizmos/Helper',
  component: Helper,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Helper>

type Story = StoryObj<typeof Helper>

const HelperScene1 = (_props: ComponentProps<typeof Helper>) => {
  return (
    <Sphere>
      <meshBasicMaterial />

      <Helper type={BoxHelper} args={['royalblue']} />
      <Helper type={VertexNormalsHelper} args={[1, 0xff0000]} />
    </Sphere>
  )
}

export const HelperSt1 = {
  render: (args) => <HelperScene1 {...args} />,
  name: 'Default',
} satisfies Story

const HelperScene2 = (_props: ComponentProps<typeof Helper>) => {
  const camera = React.useRef<THREE.PerspectiveCamera>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (camera.current) {
      camera.current.lookAt(0, 0, 0)

      camera.current.position.x = Math.sin(t) * 4
      camera.current.position.z = Math.cos(t) * 4
    }
  })

  return (
    <PerspectiveCamera makeDefault={false} position={[0, 3, 3]} near={1} far={4} ref={camera}>
      <meshBasicMaterial />

      <Helper type={CameraHelper} />
    </PerspectiveCamera>
  )
}

export const HelperSt2 = {
  render: (args) => <HelperScene2 {...args} />,
  name: 'Camera Helper',
} satisfies Story

import * as React from 'react'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { CameraShake, OrbitControls } from '../../src'
import { ComponentProps } from 'react'

export default {
  title: 'Staging/CameraShake',
  component: CameraShake,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    maxPitch: 0.05,
    maxRoll: 0.05,
    maxYaw: 0.05,
    pitchFrequency: 0.8,
    rollFrequency: 0.8,
    yawFrequency: 0.8,
  },
  argTypes: {
    maxPitch: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    maxRoll: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    maxYaw: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    pitchFrequency: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    rollFrequency: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    yawFrequency: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  },
} satisfies Meta<typeof CameraShake>

type Story = StoryObj<typeof CameraShake>

function CameraShakeScene1(props: ComponentProps<typeof CameraShake>) {
  const cube = React.useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (cube.current) {
      cube.current.rotation.x = cube.current.rotation.y += 0.01
    }
  })

  return (
    <>
      <CameraShake {...props} />

      <mesh ref={cube}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial wireframe color="white" />
      </mesh>
      <mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <planeGeometry args={[200, 200, 75, 75]} />
        <meshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export const CameraShakeSt1 = {
  render: (args) => <CameraShakeScene1 {...args} />,
  name: 'Default',
} satisfies Story

function CameraShakeScene2(props: ComponentProps<typeof CameraShake>) {
  const controlsRef = React.useRef<OrbitControlsImpl>(null)
  return (
    <>
      <OrbitControls ref={controlsRef} />
      <CameraShake {...props} />
      <CameraShakeScene1 />
    </>
  )
}

export const CameraShakeSt2 = {
  render: (args) => <CameraShakeScene2 {...args} />,
  name: 'With OrbitControls',
} satisfies Story

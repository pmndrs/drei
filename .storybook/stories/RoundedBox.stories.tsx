import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { RoundedBox, RoundedBoxGeometry } from '@react-three/drei'

export default {
  title: 'Shapes/RoundedBox',
  component: RoundedBox,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(-30, 30, 30)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof RoundedBox>

type Story = StoryObj<typeof RoundedBox>
type GeometryStory = StoryObj<typeof RoundedBoxGeometry>

function RoundedBoxScene(props: React.ComponentProps<typeof RoundedBox>) {
  const ref = useTurntable<React.ComponentRef<typeof RoundedBox>>()

  return (
    <RoundedBox ref={ref} {...props}>
      <meshPhongMaterial color="#f3f3f3" wireframe />
    </RoundedBox>
  )
}

export const RoundedBoxSt = {
  args: {
    args: [25, 25, 25],
    radius: 1,
    smoothness: 5,
  },
  render: (args) => <RoundedBoxScene {...args} />,
  name: 'Default',
} satisfies Story

//

function RoundedBoxScene2(props: React.ComponentProps<typeof RoundedBox>) {
  const ref = useTurntable<React.ComponentRef<typeof RoundedBox>>()

  return (
    <>
      <spotLight position={[35, 35, 35]} intensity={2 * Math.PI} decay={0} />
      <RoundedBox ref={ref} {...props}>
        <meshPhongMaterial color="#f3f3f3" />
      </RoundedBox>
    </>
  )
}

export const RoundedBoxSt2 = {
  args: {
    args: [25, 25, 25],
    radius: 8,
    smoothness: 5,
  },
  render: (args) => <RoundedBoxScene2 {...args} />,
  name: 'Solid',
} satisfies Story

function RoundedBoxGeometryScene(props: React.ComponentProps<typeof RoundedBoxGeometry>) {
  const ref = useTurntable<React.ComponentRef<typeof RoundedBox>>()

  return (
    <>
      <spotLight position={[35, 35, 35]} intensity={2 * Math.PI} decay={0} />
      <mesh ref={ref}>
        <RoundedBoxGeometry {...props} />
        <meshPhongMaterial color="#f3f3f3" />
      </mesh>
    </>
  )
}

export const RoundedBoxGeometrySt = {
  args: {
    args: [20, 20, 20],
    radius: 2,
    smoothness: 8,
    bevelSegments: 2,
    steps: 1,
    creaseAngle: 0.1,
  },
  render: (args) => <RoundedBoxGeometryScene {...args} />,
  name: 'From Geometry',
} satisfies GeometryStory

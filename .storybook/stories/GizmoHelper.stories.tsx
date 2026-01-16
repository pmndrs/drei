import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { GizmoHelper, OrbitControls, useGLTF, GizmoViewcube, GizmoViewport } from '@react-three/drei'
import { Setup } from '../Setup'
import { ComponentProps } from 'react'

const alignments = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'bottom-center',
  'center-right',
  'center-left',
  'center-center',
  'top-center',
] as const

export default {
  title: 'Gizmos/GizmoHelper',
  component: GizmoHelper,
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    alignment: alignments[2],
    margin: [80, 80],
  },
  argTypes: {
    alignment: {
      control: { type: 'select' },
      options: alignments,
    },
  },
} satisfies Meta<typeof GizmoHelper>

type Story = StoryObj<typeof GizmoHelper>

function Tokyo() {
  const { scene } = useGLTF('LittlestTokyo.glb')

  return <primitive object={scene} scale={0.01} />
}

const GizmoHelperScene1 = (props: ComponentProps<typeof GizmoHelper>) => {
  return (
    <React.Suspense fallback={null}>
      <Tokyo />

      <GizmoHelper {...props}>
        <GizmoViewcube />
      </GizmoHelper>
      <OrbitControls makeDefault />
    </React.Suspense>
  )
}

export const GizmoHelperSt1: Story = {
  name: 'Cube',
  render: (args) => <GizmoHelperScene1 {...args} />,
} satisfies Story

const GizmoHelperScene2 = (props: ComponentProps<typeof GizmoHelper>) => {
  return (
    <React.Suspense fallback={null}>
      <Tokyo />

      <GizmoHelper {...props}>
        <GizmoViewport />
      </GizmoHelper>

      <OrbitControls makeDefault />
    </React.Suspense>
  )
}

export const GizmoHelperSt2: Story = {
  name: 'Viewport',
  render: (args) => <GizmoHelperScene2 {...args} />,
} satisfies Story

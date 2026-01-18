import * as React from 'react'
import { Object3D } from 'three'
import { TransformControls as TransformControlsImpl } from 'three/examples/jsm/controls/TransformControls.js'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Box, OrbitControls, Select, TransformControls } from 'drei'

export default {
  title: 'Gizmos/TransformControls',
  component: TransformControls,
} satisfies Meta<typeof TransformControls>

type Story = StoryObj<typeof TransformControls>

function TransformControlsScene(props: React.ComponentProps<typeof TransformControls>) {
  const ref = React.useRef<TransformControlsImpl>(null!)

  React.useEffect(() => {
    const cb = (e: KeyboardEvent) => e.key === 'Escape' && ref.current.reset()
    document.addEventListener('keydown', cb)
    return () => document.removeEventListener('keydown', cb)
  })

  return (
    <Setup>
      <TransformControls ref={ref} {...props}>
        <Box>
          <meshBasicMaterial wireframe />
        </Box>
      </TransformControls>
    </Setup>
  )
}

export const TransformControlsSt = {
  render: (args) => <TransformControlsScene {...args} />,
  name: 'Default',
} satisfies Story

//

function TransformControlsSelectObjectScene(props: React.ComponentProps<typeof TransformControls>) {
  const [selected, setSelected] = React.useState<Object3D[]>([])
  const active = selected[0]

  return (
    <Setup controls={false}>
      <OrbitControls makeDefault />
      {active && <TransformControls {...props} object={active} />}
      <Select box onChange={setSelected}>
        <group>
          <Box position={[-1, 0, 0]}>
            <meshBasicMaterial wireframe color="orange" />
          </Box>
        </group>
        <group>
          <Box position={[0, 0, 0]}>
            <meshBasicMaterial wireframe color="green" />
          </Box>
        </group>
      </Select>
    </Setup>
  )
}

export const TransformControlsSelectObjectSt = {
  render: (args) => <TransformControlsSelectObjectScene {...args} />,
  name: 'With <Select />',
} satisfies Story

//

function TransformControlsLockScene(props: React.ComponentProps<typeof TransformControls>) {
  const orbitControls = React.useRef<OrbitControlsImpl>(null!)
  const transformControls = React.useRef<TransformControlsImpl>(null!)

  React.useEffect(() => {
    if (transformControls.current) {
      const { current: controls } = transformControls
      const callback = (event) => (orbitControls.current.enabled = !event.value)
      controls.addEventListener('dragging-changed', callback)
      return () => controls.removeEventListener('dragging-changed', callback)
    }
  })

  return (
    <>
      <TransformControls ref={transformControls} {...props}>
        <Box>
          <meshBasicMaterial wireframe />
        </Box>
      </TransformControls>
      <OrbitControls ref={orbitControls} />
    </>
  )
}

export const TransformControlsLockSt = {
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    mode: 'translate',
    showX: true,
    showY: true,
    showZ: true,
  },
  argTypes: {
    mode: {
      control: {
        type: 'radio',
        options: {
          scale: 'scale',
          rotate: 'rotate',
          translate: 'translate',
        },
      },
    },
    showX: { control: 'boolean' },
    showY: { control: 'boolean' },
    showZ: { control: 'boolean' },
  },
  render: (args) => <TransformControlsLockScene {...args} />,
  name: 'Lock orbit controls while transforming',
} satisfies Story

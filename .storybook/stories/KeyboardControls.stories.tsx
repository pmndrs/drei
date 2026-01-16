import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import { useRef } from 'react'
import { MathUtils, Mesh, Vector3 } from 'three'
import { Cone, KeyboardControls, useKeyboardControls } from '@react-three/drei'
import { Setup } from '../Setup'
import { Meta, StoryObj } from '@storybook/react-vite'

export default {
  title: 'Controls/KeyboardControls',
  component: KeyboardControls,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 10, 0)} lights={true}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof KeyboardControls>

type Story = StoryObj<typeof KeyboardControls>

enum Controls {
  forward = 'forward',
  left = 'left',
  right = 'right',
  back = 'back',
  color = 'color',
}

function KeyboardControlsScene(props: React.ComponentProps<typeof KeyboardControls>) {
  const [color, setColor] = React.useState('green')

  return (
    <KeyboardControls
      {...props}
      onChange={(name, pressed, _state) => {
        // Test onChange by toggling the color.
        if (name === Controls.color && pressed) {
          setColor((color) => (color === 'green' ? 'red' : 'green'))
        }
      }}
    >
      <Player color={color} />
    </KeyboardControls>
  )
}

export const KeyboardControlsSt = {
  name: 'Default',
  render: (args) => <KeyboardControlsScene {...args} />,
  args: {
    map: [
      { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
      { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
      { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
      { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
      { name: Controls.color, keys: ['Space'] },
    ],
  },
} satisfies Story

const _velocity = new Vector3()
const speed = 10

type PlayerProps = { color: string }

const Player = ({ color }: PlayerProps) => {
  const ref = useRef<Mesh>(null)
  const [, get] = useKeyboardControls<Controls>()

  useFrame((_s, dl) => {
    if (!ref.current) return
    const state = get()
    if (state.left && !state.right) _velocity.x = -1
    if (state.right && !state.left) _velocity.x = 1
    if (!state.left && !state.right) _velocity.x = 0

    if (state.forward && !state.back) _velocity.z = -1
    if (state.back && !state.forward) _velocity.z = 1
    if (!state.forward && !state.back) _velocity.z = 0

    ref.current.position.addScaledVector(_velocity, speed * dl)

    ref.current.rotateY(4 * dl * _velocity.x)
  })

  return (
    <Cone ref={ref} args={[1, 3, 4]} rotation={[-90 * MathUtils.DEG2RAD, 0, 0]}>
      <meshLambertMaterial color={color} />
    </Cone>
  )
}

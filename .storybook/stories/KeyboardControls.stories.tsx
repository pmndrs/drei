import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import { useMemo, useRef } from 'react'
import { MathUtils, Mesh, Vector3 } from 'three'
import { Cone, KeyboardControls, KeyboardControlsEntry, useKeyboardControls } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Controls/KeyboardControls',
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 10, 0)} lights={true}>
        {storyFn()}
      </Setup>
    ),
  ],
}

enum Controls {
  forward = 'forward',
  left = 'left',
  right = 'right',
  back = 'back',
}

export const KeyboardControlsSt = () => {
  const map = useMemo<KeyboardControlsEntry[]>(
    () => [
      { name: Controls.forward, keys: ['ArrowUp', 'w', 'W'] },
      { name: Controls.back, keys: ['ArrowDown', 's', 'S'] },
      { name: Controls.left, keys: ['ArrowLeft', 'a', 'A'] },
      { name: Controls.right, keys: ['ArrowRight', 'd', 'D'] },
    ],
    []
  )

  return (
    <KeyboardControls map={map}>
      <Player />
    </KeyboardControls>
  )
}

const _velocity = new Vector3()
const speed = 10

const Player = () => {
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
      <meshLambertMaterial color="green" />
    </Cone>
  )
}

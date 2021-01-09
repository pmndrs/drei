import * as React from 'react'
import { useFrame } from 'react-three-fiber'
import { Color, Vector3, Mesh } from 'three'

import { Setup } from '../Setup'

import { Reflector, Box } from '../../src'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-2, 2, 6)}> {storyFn()}</Setup>],
}

const reflectorCol = new Color('#333')

function ReflectorScene() {
  const $box = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 100
    $box.current.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <Reflector
        clipBias={0.1}
        textureWidth={1024}
        textureHeight={1024}
        rotation={[-Math.PI / 2, 0, 0]}
        color={reflectorCol}
      >
        <planeBufferGeometry args={[10, 10]} attach="geometry" />
      </Reflector>

      <Box position={[-2, 1, -1]} material-color="hotpink" material-wireframe />
      <Box args={[2, 2, 2]} ref={$box} position={[0, 1, 0]} material-color="hotpink" />
      <Box position={[2, 1, 1]} material-color="hotpink" material-wireframe />
    </>
  )
}

export const ReflectorSt = () => <ReflectorScene />
ReflectorSt.storyName = 'Default'

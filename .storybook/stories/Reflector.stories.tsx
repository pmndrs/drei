import * as React from 'react'
import { useFrame } from 'react-three-fiber'
import { Vector3, Mesh } from 'three'

import { Setup } from '../Setup'

import { Reflector, Box } from '../../src'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-2, 2, 6)}> {storyFn()}</Setup>],
}

function ReflectorScene() {
  const $box = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 100
    $box.current.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <Reflector
        position={[0, 0, 0]}
        resolution={512}
        args={[10, 10]}
        mirror={0.5}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        blur={[400, 100]}
      >
        {(Material, props) => <Material color="#a0a0a0" metalness={0.5} normalScale={[1, 1]} {...props} />}
      </Reflector>

      <Box position={[-2, 1, -1]} material-color="hotpink" material-wireframe />
      <Box args={[2, 2, 2]} ref={$box} position={[0, 1, 0]} material-color="hotpink" />
      <Box position={[2, 1, 1]} material-color="hotpink" material-wireframe />
    </>
  )
}

export const ReflectorSt = () => <ReflectorScene />
ReflectorSt.storyName = 'Default'

import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

import { Setup } from '../Setup'

import { Shadow, Icosahedron, Plane } from '../../src'

export default {
  title: 'Misc/Shadow',
  component: Shadow,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function ShadowScene() {
  const shadow = React.useRef<Mesh>(null!)
  const mesh = React.useRef<Mesh>(null!)

  useFrame(({ clock }) => {
    shadow.current.scale.x = Math.sin(clock.getElapsedTime()) + 3
    shadow.current.scale.y = Math.sin(clock.getElapsedTime()) + 3

    mesh.current.position.y = Math.sin(clock.getElapsedTime()) + 2.5
  })

  return (
    <>
      <Icosahedron ref={mesh} args={[1, 2]} position-y={2}>
        <meshBasicMaterial color="lightblue" wireframe />
      </Icosahedron>
      <Shadow ref={shadow} scale={[2, 2, 2]} position-y={0.1} rotation-x={-Math.PI / 2} />

      <Plane args={[4, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="white" />
      </Plane>
    </>
  )
}

export const ShadowSt = () => <ShadowScene />
ShadowSt.storyName = 'Default'

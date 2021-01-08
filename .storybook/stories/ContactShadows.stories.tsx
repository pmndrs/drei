import * as React from 'react'
import { useFrame } from 'react-three-fiber'
import { Mesh } from 'three'

import { Setup } from '../Setup'

import { ContactShadows, Icosahedron, Plane } from '../../src'

export default {
  title: 'Shaders/ContactShadows',
  component: ContactShadows,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function ContactShadowScene() {
  const mesh = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    mesh.current.position.y = Math.sin(clock.getElapsedTime()) + 2.5
  })

  return (
    <>
      <Icosahedron ref={mesh} args={[1, 2]} position-y={2}>
        <meshBasicMaterial attach="material" color="lightblue" />
      </Icosahedron>

      <ContactShadows width={10} height={10} far={20} rotation={[-Math.PI / 2, 0, 0]} />

      <Plane args={[10, 10]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial attach="material" color="white" />
      </Plane>
    </>
  )
}

export const ContactShadowSt = () => <ContactShadowScene />
ContactShadowSt.storyName = 'Default'

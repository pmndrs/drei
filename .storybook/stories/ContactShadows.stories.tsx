import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

import { Setup } from '../Setup'

import { ContactShadows, Sphere, Plane } from '../../src'

export default {
  title: 'Staging/ContactShadows',
  component: ContactShadows,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function ContactShadowScene({ colorized }: any) {
  const mesh = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    mesh.current.position.y = Math.sin(clock.getElapsedTime()) + 2
  })

  return (
    <>
      <Sphere ref={mesh} args={[1, 32, 32]} position-y={2}>
        <meshBasicMaterial color="#2A8AFF" />
      </Sphere>
      <ContactShadows
        position={[0, 0, 0]}
        scale={10}
        far={3}
        blur={3}
        rotation={[Math.PI / 2, 0, 0]}
        color={colorized ? '#2A8AFF' : 'black'}
      />
      <Plane args={[10, 10]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="white" />
      </Plane>
    </>
  )
}

export const ContactShadowSt = () => <ContactShadowScene />
ContactShadowSt.storyName = 'Default'

export const ContactShadowStColor = () => <ContactShadowScene colorized />
ContactShadowStColor.storyName = 'Colorized'

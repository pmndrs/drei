import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { ContactShadows, Sphere, Plane } from 'drei'
import { ComponentProps } from 'react'

export default {
  title: 'Staging/ContactShadows',
  component: ContactShadows,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ContactShadows>

type Story = StoryObj<typeof ContactShadows>

function ContactShadowsScene(props: ComponentProps<typeof ContactShadows>) {
  const mesh = React.useRef<Mesh>(null!)
  useFrame(({ elapsed }) => {
    mesh.current.position.y = Math.sin(elapsed) + 2
  })

  return (
    <>
      <Sphere ref={mesh} args={[1, 32, 32]} position-y={2}>
        <meshBasicMaterial color="#2A8AFF" />
      </Sphere>

      <ContactShadows {...props} position={[0, 0, 0]} scale={10} far={3} blur={3} rotation={[Math.PI / 2, 0, 0]} />

      <Plane args={[10, 10]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="white" />
      </Plane>
    </>
  )
}

export const ContactShadowsSt1 = {
  render: (args) => <ContactShadowsScene {...args} />,
  name: 'Default',
} satisfies Story

export const ContactShadowsSt2 = {
  render: (args) => <ContactShadowsScene {...args} />,
  name: 'Colorized',
  args: {
    color: '#2A8AFF',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story

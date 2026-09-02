import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Sphere, Plane } from 'drei'
import { ContactShadows } from './ContactShadows'

export default {
  title: 'Staging/ContactShadows (WebGPU)',
  component: ContactShadows,
  decorators: [
    (Story, context) => (
      // `limitedTo` is what actually pins the renderer — Setup computes
      // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
      // so this stays on WebGPU whatever the toolbar says.
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(-5, 5, 5)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof ContactShadows>

type Story = StoryObj<typeof ContactShadows>

/**
 * Mirrors the legacy story (src/legacy/Materials/ContactShadows) so the two are
 * directly comparable: a bobbing sphere over a white plane, primitives only.
 */
function ContactShadowsScene(props: React.ComponentProps<typeof ContactShadows>) {
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

/**
 * The TSL port documents `color` as non-functional (MultiplyBlending on a white
 * clear only supports grayscale). Kept as a story so the gap stays visible.
 */
export const ContactShadowsSt2 = {
  render: (args) => <ContactShadowsScene {...args} />,
  name: 'Colorized (color prop is a known no-op)',
  args: {
    color: '#2A8AFF',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story

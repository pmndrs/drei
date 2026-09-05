import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Sphere } from 'drei'
import { Trail } from './Trail'

export default {
  title: 'Effects/Trail (WebGPU)',
  component: Trail,
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(0, 3, 8)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof Trail>

type Story = StoryObj<typeof Trail>

/**
 * Trail portals a Line2 into the scene and follows its first child. An orbiting
 * sphere inside a rotating group gives it something to track; `state.elapsed`
 * replaces the removed `state.clock` from r3f v10.
 */
function TrailScene(props: React.ComponentProps<typeof Trail>) {
  const group = React.useRef<Group>(null!)
  const sphere = React.useRef<Mesh>(null!)

  useFrame(({ elapsed }) => {
    group.current.rotation.z = elapsed
    sphere.current.position.x = Math.sin(elapsed * 2) * 2
    sphere.current.position.z = Math.cos(elapsed * 2) * 2
  })

  return (
    <>
      <group ref={group}>
        <Trail {...props}>
          <Sphere ref={sphere} args={[0.1, 32, 32]} position-y={3}>
            <meshNormalMaterial />
          </Sphere>
        </Trail>
      </group>

      <axesHelper />
    </>
  )
}

export const TrailSt = {
  name: 'Default',
  render: (args) => <TrailScene {...args} />,
  args: {
    width: 1,
    length: 4,
    color: '#F8D628',
    attenuation: (t: number) => t * t,
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story

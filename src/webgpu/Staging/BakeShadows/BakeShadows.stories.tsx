import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { BakeShadows } from './BakeShadows'

export default {
  title: 'Staging/BakeShadows (WebGPU)',
  component: BakeShadows,
  // This is the src/webgpu implementation, so it cannot run on the WebGL
  // renderer — pin it rather than letting the toolbar toggle break it.
  decorators: [
    (Story, context) => (
      // `limitedTo` is what actually pins the renderer — Setup computes
      // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
      // so this stays on WebGPU whatever the toolbar says.
      //
      // Setup's own lights do not cast, and its ground plane does not receive,
      // so the story brings its own — otherwise there is no shadow to freeze
      // and the story proves nothing either way.
      <Setup
        renderer={context.globals.renderer}
        limitedTo="webgpu"
        lights={false}
        floor={false}
        cameraPosition={new Vector3(0, 4, 9)}
      >
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof BakeShadows>

type SceneProps = {
  /** Mount BakeShadows. Off = the shadow tracks the box; on = it freezes. */
  bake: boolean
}

type Story = StoryObj<SceneProps>

/**
 * BakeShadows renders nothing, so the only way to see whether it works is to
 * watch a shadow that *should* be moving. The box orbits; with `bake` on, its
 * shadow must stay pinned where it was on the first frame while the box keeps
 * moving over it. Primitives rather than a GLTF: a blank render can then only
 * mean the component. Tracked in #2659.
 */
function OrbitingCaster() {
  const ref = React.useRef<React.ComponentRef<'mesh'>>(null)

  useFrame((state) => {
    if (!ref.current) return
    // `state.elapsed` — `state.clock` is gone in r3f v10.
    const t = state.elapsed
    ref.current.position.set(Math.sin(t) * 2.2, 1.4, Math.cos(t) * 2.2)
    ref.current.rotation.set(t * 0.7, t, 0)
  })

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" roughness={0.4} />
    </mesh>
  )
}

function BakeShadowsScene({ bake }: SceneProps) {
  return (
    <>
      <color attach="background" args={['#1b1d23']} />

      <ambientLight intensity={0.35} />
      <directionalLight castShadow position={[4, 8, 4]} intensity={2.5} shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.1, 25]} />
      </directionalLight>

      <OrbitingCaster />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#8d8d96" />
      </mesh>

      {bake && <BakeShadows />}
    </>
  )
}

export const BakeShadowsSt = {
  name: 'Default',
  render: (args) => <BakeShadowsScene {...args} />,
  args: {
    bake: true,
  },
} satisfies Story

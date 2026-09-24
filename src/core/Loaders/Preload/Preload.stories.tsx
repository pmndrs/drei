import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Html, Preload } from 'drei'

export default {
  title: 'Loaders/Preload',
  component: Preload,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 2, 6)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Preload>

type Story = StoryObj<typeof Preload>

function Compiling() {
  return (
    <Html center>
      <span style={{ color: 'white' }}>compiling…</span>
    </Html>
  )
}

// A handful of distinct materials so there is something to compile, plus an
// invisible object that only `all` picks up.
function PreloadScene(props: React.ComponentProps<typeof Preload>) {
  return (
    <React.Suspense fallback={<Compiling />}>
      <mesh position={[-2.5, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial color="lightblue" roughness={0.2} metalness={1} clearcoat={1} />
      </mesh>
      <mesh position={[2.5, 0, 0]}>
        <torusKnotGeometry args={[0.5, 0.2, 96, 16]} />
        <meshNormalMaterial />
      </mesh>
      <mesh visible={false} position={[0, 2, 0]}>
        <octahedronGeometry />
        <meshLambertMaterial color="orange" />
      </mesh>
      <Preload {...props} />
    </React.Suspense>
  )
}

export const PreloadSt = {
  render: (args) => <PreloadScene {...args} />,
  args: { all: true },
  name: 'Default',
} satisfies Story

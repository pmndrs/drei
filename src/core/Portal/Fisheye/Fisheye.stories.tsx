import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Fisheye, OrbitControls } from 'drei'

export default {
  title: 'Portals/Fisheye',
  component: Fisheye,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Fisheye>

type Story = StoryObj<typeof Fisheye>

//* Fisheye Scene ==============================

function FisheyeScene(props: React.ComponentProps<typeof Fisheye>) {
  return (
    <Fisheye {...props}>
      <color attach="background" args={['#22CFC1']} />
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Objects */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <mesh position={[2, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <mesh position={[-2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -1, 0]} />
    </Fisheye>
  )
}

//* Stories ==============================

export const FisheyeSt = {
  args: {
    zoom: 0,
    resolution: 256,
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    resolution: { control: { type: 'range', min: 64, max: 1024, step: 64 } },
  },
  render: (args) => <FisheyeScene {...args} />,
  name: 'Default',
} satisfies Story

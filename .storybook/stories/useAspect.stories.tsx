import * as React from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader, Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { useAspect, Plane } from '../../src'

function UseAspect({
  width,
  height,
  factor,
  ...rest
}: { width: number; height: number; factor: number } & React.ComponentProps<'group'>) {
  const scale = useAspect(width, height, factor)

  return <group scale={scale} {...rest} />
}

export default {
  title: 'Misc/useAspect',
  component: UseAspect,
  argTypes: {
    width: { control: { type: 'range', min: 0, max: 5000 } },
    height: { control: { type: 'range', min: 0, max: 2000 } },
    factor: { control: { type: 'range', min: 0, max: 10, step: 0.01 } },
  },
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, -10, 0)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof UseAspect>

type Story = StoryObj<typeof UseAspect>

function SimpleScene(props: React.ComponentProps<typeof UseAspect>) {
  return (
    <UseAspect {...props} rotation-x={Math.PI / 2}>
      <Plane args={[1, 1, 4, 4]}>
        <meshPhongMaterial wireframe />
      </Plane>
    </UseAspect>
  )
}

export const SimpleSt = {
  args: {
    width: 1920,
    height: 1080,
    factor: 1,
  },
  render: (args) => <SimpleScene {...args} />,
  name: 'Default',
} satisfies Story

//

function TextureScene(props: React.ComponentProps<typeof UseAspect>) {
  const map = useLoader(TextureLoader, `images/living-room-1.jpg`)

  return (
    <UseAspect {...props} rotation-x={Math.PI / 2}>
      <Plane>
        <meshPhongMaterial map={map} color="grey" />
      </Plane>
    </UseAspect>
  )
}

export const TextureSt = {
  args: {
    width: 3024,
    height: 4032,
    factor: 1,
  },
  render: (args) => <TextureScene {...args} />,
  name: 'With Texture',
} satisfies Story

import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { Stage, Sphere } from '@react-three/drei'
import { presetsObj, PresetsType } from '../../src/helpers/environment-assets'

const environments = Object.keys(presetsObj) as Array<PresetsType>

export default {
  title: 'Staging/Stage',
  component: Stage,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 3)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Stage>

type Story = StoryObj<typeof Stage>

const presets = ['rembrant', 'portrait', 'upfront', 'soft']

function StageScene(props: React.ComponentProps<typeof Stage>) {
  return (
    <>
      <color attach="background" args={['white']} />
      <Stage {...props}>
        <Sphere args={[1, 64, 64]}>
          <meshStandardMaterial roughness={0} color="royalblue" />
        </Sphere>
      </Stage>
    </>
  )
}

export const StageSt = {
  args: {
    intensity: 1,
    environment: environments[0],
    preset: 'rembrandt',
  },
  argTypes: {
    environment: { control: 'select', options: environments },
    preset: { control: 'select', options: presets },
  },
  render: (args) => <StageScene {...args} />,
  name: 'Default',
} satisfies Story

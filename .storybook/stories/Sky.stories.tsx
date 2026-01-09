import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Sky, Plane } from '../../src'

export default {
  title: 'Staging/Sky',
  component: Sky,
  argTypes: {
    turbidity: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    rayleigh: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    mieCoefficient: { control: { type: 'range', min: 0, max: 0.1, step: 0.001 } },
    mieDirectionalG: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    inclination: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    azimuth: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Sky>

type Story = StoryObj<typeof Sky>

function SkyScene(props: React.ComponentProps<typeof Sky>) {
  return (
    <>
      <Sky {...props} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt = {
  args: {
    turbidity: 8,
    rayleigh: 6,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    sunPosition: [1, 0, 0],
  },

  render: (args) => <SkyScene {...args} />,
  name: 'Default',
} satisfies Story

//

function SkyScene2(props: React.ComponentProps<typeof Sky>) {
  return (
    <>
      <Sky {...props} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt2 = {
  args: {
    distance: 3000,
    turbidity: 8,
    rayleigh: 6,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    inclination: 0.49,
    azimuth: 0.25,
  },
  render: (args) => <SkyScene2 {...args} />,
  name: 'Custom angles',
} satisfies Story

//

function SkyScene3(props: React.ComponentProps<typeof Sky>) {
  // NOT the right way to do it...
  const [, setInclination] = React.useState(0)
  useFrame(() => {
    setInclination((a) => a + 0.002)
  })

  return (
    <>
      <Sky {...props} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt3 = {
  args: {
    distance: 3000,
    turbidity: 8,
    rayleigh: 6,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    inclination: 0.49,
    azimuth: 0.25,
  },
  render: (args) => <SkyScene3 {...args} />,
  name: 'Rotation',
} satisfies Story

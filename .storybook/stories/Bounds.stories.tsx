import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Bounds, Box, Sphere, Torus } from '../../src'

export default {
  title: 'Staging/Bounds',
  component: Bounds,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Bounds>

type Story = StoryObj<typeof Bounds>

function BoundsScene(props: React.ComponentProps<typeof Bounds>) {
  return (
    <Bounds {...props}>
      <Box position={[-2, 0, 0]} args={[1, 1, 1]}>
        <meshStandardMaterial color="royalblue" />
      </Box>

      <Sphere position={[2, 1, 0]} args={[0.75, 32, 32]}>
        <meshStandardMaterial color="hotpink" />
      </Sphere>

      <Torus position={[0, -1, 2]} args={[0.6, 0.25, 16, 32]}>
        <meshStandardMaterial color="orange" />
      </Torus>
    </Bounds>
  )
}

/**
 * `Bounds` auto-fits the camera to enclose all children.
 */
export const BoundsSt = {
  render: (args) => <BoundsScene {...args} />,
  name: 'Default',
  args: {
    fit: true,
    clip: true,
    observe: true,
    margin: 1.2,
  },
} satisfies Story

//

function BoundsMarginScene() {
  return (
    <Bounds fit clip observe margin={2}>
      <Box position={[-1, 0, 0]} args={[1, 1, 1]}>
        <meshStandardMaterial color="royalblue" />
      </Box>

      <Sphere position={[1, 0, 0]} args={[0.75, 32, 32]}>
        <meshStandardMaterial color="hotpink" />
      </Sphere>
    </Bounds>
  )
}

/**
 * A larger `margin` zooms the camera out further from the bounding box.
 */
export const BoundsMarginSt = {
  render: () => <BoundsMarginScene />,
  name: 'Margin',
} satisfies Story

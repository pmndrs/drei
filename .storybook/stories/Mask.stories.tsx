import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Box, Mask, Sphere, useMask } from '../../src'

export default {
  title: 'Portals/Mask',
  component: Mask,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Mask>

type Story = StoryObj<typeof Mask>

function MaskedContent({ invert = false }: { invert?: boolean }) {
  const stencil = useMask(1, invert)

  return (
    <>
      {/* This box is only visible through the mask */}
      <Box args={[4, 4, 4]} position={[0, 0, 0]}>
        <meshStandardMaterial color="orange" {...stencil} />
      </Box>
    </>
  )
}

function MaskScene(props: Partial<React.ComponentProps<typeof Mask>>) {
  return (
    <>
      {/* Circular mask */}
      <Mask id={1} position={[0, 0, 0]} {...props}>
        <circleGeometry args={[1, 64]} />
      </Mask>

      {/* Content visible only through the mask */}
      <MaskedContent />

      {/* A regular sphere behind for reference */}
      <Sphere args={[0.4, 32, 32]} position={[2, 0, -1]}>
        <meshStandardMaterial color="royalblue" />
      </Sphere>
    </>
  )
}

/**
 * `Mask` uses stencil buffers to reveal content only through the mask shape.
 * Here, a large orange box is only visible through the circular mask.
 */
export const MaskSt = {
  render: (args) => <MaskScene {...args} />,
  name: 'Default',
  args: {
    id: 1,
    colorWrite: false,
    depthWrite: false,
  },
} satisfies Story

//

function MaskInverseScene() {
  return (
    <>
      {/* Circular mask */}
      <Mask id={1} position={[0, 0, 0]}>
        <circleGeometry args={[1, 64]} />
      </Mask>

      {/* Inverted: content visible everywhere EXCEPT through the mask */}
      <MaskedContent invert />

      <Sphere args={[0.4, 32, 32]} position={[2, 0, -1]}>
        <meshStandardMaterial color="royalblue" />
      </Sphere>
    </>
  )
}

/**
 * With `useMask(id, true)`, the mask is inverted: content is visible everywhere
 * except where the mask shape is.
 */
export const MaskInverseSt = {
  render: () => <MaskInverseScene />,
  name: 'Inverse',
} satisfies Story

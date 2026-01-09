import React, { ComponentProps, Suspense, useRef } from 'react'
import * as THREE from 'three'

import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Float } from 'drei'

export default {
  title: 'Staging/Float',
  component: Float,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new THREE.Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Float>

type Story = StoryObj<typeof Float>

function FloatScene(props: ComponentProps<typeof Float>) {
  const cube = useRef(null)

  return (
    <>
      <Suspense fallback={null}>
        <Float {...props} position={[0, 1.1, 0]} rotation={[Math.PI / 3.5, 0, 0]}>
          <mesh ref={cube}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial wireframe color="white" />
          </mesh>
        </Float>
      </Suspense>

      {/* ground plane */}
      <mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <planeGeometry args={[200, 200, 75, 75]} />
        <meshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export const FloatSt = {
  render: (args) => <FloatScene {...args} />,
  name: 'Default',

  args: {
    floatingRange: [undefined, 1],
    rotationIntensity: 4,
    floatIntensity: 2,
    speed: 5,
  },
} satisfies Story

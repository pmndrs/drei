import React, { ComponentProps, forwardRef, Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Float } from '../../src'
import { float } from 'three/examples/jsm/nodes/Nodes.js'

export default {
  title: 'Staging/Float',
  component: Float,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}> {storyFn()}</Setup>],
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

import * as THREE from 'three'
import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Facemesh, FacemeshDatas } from 'drei'

export default {
  title: 'Geometry/Facemesh',
  tags: ['external'],
  component: Facemesh,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)} cameraFov={60}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Facemesh>

type Story = StoryObj<typeof Facemesh>

function FacemeshScene(props: React.ComponentProps<typeof Facemesh>) {
  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <Facemesh
        {...props}
        faceBlendshapes={FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT.faceBlendshapes[0]}
        facialTransformationMatrix={FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT.facialTransformationMatrixes[0]}
        rotation-z={Math.PI}
      >
        <meshStandardMaterial side={THREE.DoubleSide} color="#cbcbcb" flatShading={true} transparent opacity={0.98} />
      </Facemesh>
    </>
  )
}

export const FacemeshSt = {
  render: (args) => <FacemeshScene {...args} />,
  args: {
    debug: true,
  },
  argTypes: {
    depth: { control: { type: 'range', min: 0, max: 6.5, step: 0.01 } },
    origin: { control: 'select', options: [undefined, 168, 9] },
    eyes: { control: { type: 'boolean' } },
    eyesAsOrigin: { control: { type: 'boolean' } },
    offset: { control: { type: 'boolean' } },
    offsetScalar: { control: { type: 'range', min: 0, max: 200, step: 1 } },
    debug: { control: { type: 'boolean' } },
  },

  name: 'Default',
} satisfies Story

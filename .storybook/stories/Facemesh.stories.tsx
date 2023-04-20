import * as THREE from 'three'
import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Facemesh } from '../../src'

export default {
  title: 'Shapes/Facemesh',
  component: Facemesh,
  decorators: [
    withKnobs,
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)} cameraFov={60}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const FacemeshSt = ({ width, flipY, wireframe, flat, skin }) => (
  <>
    <color attach="background" args={['#303030']} />
    <axesHelper />

    <Facemesh width={width} rotation-y={Math.PI} flipY={flipY}>
      <meshStandardMaterial side={THREE.DoubleSide} color={skin} flatShading={flat} wireframe={wireframe} />
    </Facemesh>
  </>
)
FacemeshSt.args = {
  width: undefined,
  flipY: undefined,
  wireframe: false,
  flat: true,
  skin: '#cbcbcb',
}

FacemeshSt.argTypes = {
  width: { control: { type: 'range', min: 0, max: 6.5, step: 0.01 } },
  flipY: { control: { type: 'boolean' } },
  wireframe: { control: { type: 'boolean' } },
  flat: { control: { type: 'boolean' } },
  skin: { control: { type: 'color' } },
}

FacemeshSt.storyName = 'Default'

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

export const FacemeshSt = ({ depth, origin, wireframe, flat, skin, debug }) => (
  <>
    <color attach="background" args={['#303030']} />
    <axesHelper />

    <Facemesh depth={depth} origin={origin} debug={debug} rotation-z={Math.PI}>
      <meshStandardMaterial side={THREE.DoubleSide} color={skin} flatShading={flat} wireframe={wireframe} />
    </Facemesh>
  </>
)
FacemeshSt.args = {
  depth: undefined,
  origin: undefined,
  wireframe: false,
  flat: true,
  skin: '#cbcbcb',
  debug: true,
}

FacemeshSt.argTypes = {
  depth: { control: { type: 'range', min: 0, max: 6.5, step: 0.01 } },
  origin: { control: 'select', options: [undefined, 168, 9] },
  wireframe: { control: { type: 'boolean' } },
  flat: { control: { type: 'boolean' } },
  skin: { control: { type: 'color' } },
  debug: { control: { type: 'boolean' } },
}

FacemeshSt.storyName = 'Default'

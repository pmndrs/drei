import React from 'react'
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Parametric } from '../../src/shapes'

export default {
  title: 'Shapes/Parametric',
  component: Parametric,
  decorators: [
    (Story) => (
      <Setup cameraPosition={[-30, 30, 30]}>
        <Story />
      </Setup>
    ),
  ],
}

function ParametricScene() {
  const ref = useTurntable()

  return (
    <Parametric ref={ref} args={[ParametricGeometries.klein, 25, 25]}>
      <meshPhongMaterial attach="material" color="#f3f3f3" wireframe />
    </Parametric>
  )
}

export const ParametricSt = () => <ParametricScene />
ParametricSt.storyName = 'Default'

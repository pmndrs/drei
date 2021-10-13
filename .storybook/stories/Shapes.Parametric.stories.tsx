import * as React from 'react'
import { Vector3 } from 'three'
import { ParametricGeometries } from 'three-stdlib'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Parametric } from '../../src'

export default {
  title: 'Shapes/Parametric',
  component: Parametric,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-30, 30, 30)}>{storyFn()}</Setup>],
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

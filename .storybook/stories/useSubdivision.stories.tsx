import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Octahedron, useSubdivision } from '../../src'

export default {
  title: 'Modifiers/useSubdivision',
  component: useSubdivision,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

function UseSubdivisionScene() {
  const meshRef = useSubdivision(number('Subdivisions', 1, { range: true, max: 5, step: 1 }))

  return (
    <Octahedron args={[3]} ref={meshRef}>
      <meshNormalMaterial attach="material" flatShading color="hotpink" />
    </Octahedron>
  )
}

export const UseSubdivisionSceneSt = () => <UseSubdivisionScene />
UseSubdivisionSceneSt.story = {
  name: 'Default',
}

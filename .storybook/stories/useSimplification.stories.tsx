import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { useSimplification, Octahedron } from '../../src'

export default {
  title: 'Modifiers/useSimplification',
  component: useSimplification,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

function UseSimplificationScene() {
  const meshRef = useSimplification(number('%', 0.1, { range: true, max: 1, step: 0.1 }))

  return (
    <Octahedron args={[3, 2]} ref={meshRef}>
      <meshNormalMaterial attach="material" flatShading color="hotpink" />
    </Octahedron>
  )
}

export const UseSimplificationSceneSt = () => <UseSimplificationScene />
UseSimplificationSceneSt.story = {
  name: 'Default',
}

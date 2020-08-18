import React from 'react'

import { setupDecorator } from '../setup-decorator'
import { MeshWobbleMaterial } from '../../src/MeshWobbleMaterial'
import { Torus } from '../../src/shapes'

export default {
  title: 'Shaders/MeshWobbleMaterial',
  component: MeshWobbleMaterial,
  decorators: [
    setupDecorator(),
  ],
}

export function MeshWobbleMaterialScene(args) {
  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial
        attach="material"
        color="#f25042"
        {...args}
      />
    </Torus>
  )
}

MeshWobbleMaterialScene.storyName = 'Default'

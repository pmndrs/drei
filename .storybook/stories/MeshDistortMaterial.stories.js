import React from 'react'

import { setupDecorator } from '../setup-decorator'
import { MeshDistortMaterial } from '../../src/MeshDistortMaterial'
import { Icosahedron } from '../../src/shapes'

export default {
  title: 'Shaders/MeshDistortMaterial',
  component: MeshDistortMaterial,
  decorators: [
    setupDecorator(),
  ],
}

export function MeshDistortMaterialScene(args) {
  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial
        attach="material"
        color="#f25042"
        {...args}
      />
    </Icosahedron>
  )
}

MeshDistortMaterialScene.storyName = 'Default'

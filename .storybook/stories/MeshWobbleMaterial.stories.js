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

export const Default = () => {
  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial color="#f25042" />
    </Torus>
  )
}

import React from 'react'

import { Setup } from '../Setup'

import { useTextureLoader } from '../../src/useTextureLoader'
import { Icosahedron } from '../../src/shapes'

export default {
  title: 'Loaders/useTextureLoader',
  component: useTextureLoader,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
}

export function TexturedMeshes() {
  const [matcap1, matcap2] = useTextureLoader(['matcap-1.png', 'matcap-2.png'])

  return (
    <>
      <Icosahedron position={[-2, 0, 0]}>
        <meshMatcapMaterial matcap={matcap1} attach="material" />
      </Icosahedron>
      <Icosahedron position={[2, 0, 0]}>
        <meshMatcapMaterial matcap={matcap2} attach="material" />
      </Icosahedron>
    </>
  )
}

TexturedMeshes.story = {
  name: 'Default',
}

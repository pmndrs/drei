import React from 'react'

import { Setup } from '../Setup'

import { useGLTFLoader } from '../../src/useGLTFLoader'

export default {
  title: 'Loaders/useGLTFLoader',
  component: useGLTFLoader,
  decorators: [
    (Story) => (
      <Setup cameraPosition={[0, 0, 5]}>
        <Story />
      </Setup>
    ),
  ],
}

export function GLTFLoader() {
  const { nodes, materials } = useGLTFLoader('suzanne.glb', true)

  return <mesh material={materials['Material.001']} geometry={nodes.Suzanne.geometry} />
}

GLTFLoader.story = {
  name: 'Default',
}

import React from 'react'

import { setupDecorator } from '../setup-decorator'

import { useGLTFLoader } from '../../src/useGLTFLoader'

export default {
  title: 'Loaders/useGLTFLoader',
  component: useGLTFLoader,
  decorators: [
    setupDecorator(),
  ],
}

export function GLTFLoader() {
  const { nodes, materials } = useGLTFLoader('suzanne.glb', true)

  return <mesh material={materials['Material.001']} geometry={nodes.Suzanne.geometry} />
}

GLTFLoader.story = {
  name: 'Default',
}

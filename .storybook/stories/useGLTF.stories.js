import React, { Suspense } from 'react'

import { Setup } from '../Setup'

import { useGLTF } from '../../src/useGLTF'

export default {
  title: 'Loaders/GLTF',
  component: useGLTF,
  decorators: [(storyFn) => <Setup cameraPosition={[0, 0, 5]}>{storyFn()}</Setup>],
}

function Suzanne() {
  const { nodes, materials } = useGLTF('suzanne.glb', true)

  return <mesh material={materials['Material.001']} geometry={nodes.Suzanne.geometry} />
}

function UseGLTFScene() {
  return (
    <Suspense fallback={null}>
      <Suzanne />
    </Suspense>
  )
}

export const UseGLTFSceneSt = () => <UseGLTFScene />
UseGLTFSceneSt.story = {
  name: 'Default',
}

function SuzanneWithLocal() {
  const { nodes, materials } = useGLTF('suzanne.glb', '/draco-gltf/')

  return (
    <group dispose={null}>
      <mesh material={materials['Material.001']} geometry={nodes.Suzanne.geometry} />
    </group>
  )
}

function DracoLocalScene() {
  return (
    <Suspense fallback={null}>
      <SuzanneWithLocal />
    </Suspense>
  )
}

export const DracoLocalSceneSt = () => <DracoLocalScene />
DracoLocalSceneSt.story = {
  name: 'Local Binaries',
}

import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { useGLTF } from '../../src'

export default {
  title: 'Loaders/GLTF',
  component: useGLTF,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Suzanne() {
  const { scene } = useGLTF('suzanne.glb', true)

  return <primitive object={scene} />
}

function UseGLTFScene() {
  return (
    <React.Suspense fallback={null}>
      <Suzanne />
    </React.Suspense>
  )
}

export const UseGLTFSceneSt = () => <UseGLTFScene />
UseGLTFSceneSt.story = {
  name: 'Default',
}

function SuzanneWithLocal() {
  const { scene } = useGLTF('suzanne.glb', '/draco-gltf/')

  return (
    <group dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

function DracoLocalScene() {
  return (
    <React.Suspense fallback={null}>
      <SuzanneWithLocal />
    </React.Suspense>
  )
}

export const DracoLocalSceneSt = () => <DracoLocalScene />
DracoLocalSceneSt.story = {
  name: 'Local Binaries',
}

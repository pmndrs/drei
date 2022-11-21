import * as React from 'react'
import { Mesh, Vector3 } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { Setup } from '../Setup'

import { useGLTF } from '../../src'

export default {
  title: 'Loaders/GLTF',
  component: useGLTF,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

type GLTFResult = GLTF & {
  nodes: {
    Suzanne: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

function Suzanne() {
  const { nodes, materials } = useGLTF('suzanne.glb', true) as unknown as GLTFResult

  return <mesh material={materials['Material.001']} geometry={(nodes.Suzanne as Mesh).geometry} />
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
  const { nodes, materials } = useGLTF('suzanne.glb', '/draco-gltf/') as unknown as GLTFResult

  return (
    <group dispose={null}>
      <mesh material={materials['Material.001']} geometry={(nodes.Suzanne as Mesh).geometry} />
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

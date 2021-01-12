import * as React from 'react'
import { useLoader } from 'react-three-fiber'
import { TextureLoader } from 'three'

import { Setup } from '../Setup'

import { Icosahedron, useTexture } from '../../src'

export default {
  title: 'Loaders/Texture',
  component: useTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  const [matcap1, matcap2] = useLoader(TextureLoader, ['matcap-1.png', 'matcap-2.png'])

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

function UseTextureScene() {
  return (
    <React.Suspense fallback={null}>
      <TexturedMeshes />
    </React.Suspense>
  )
}

export const UseTextureSceneSt = () => <UseTextureScene />
UseTextureSceneSt.story = {
  name: 'Default',
}

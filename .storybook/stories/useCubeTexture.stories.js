import React, { Suspense } from 'react'

import { Setup } from '../Setup'

import { useCubeTexture } from '../../src/useCubeTexture'
import { Icosahedron, Sphere } from '../../src/shapes'

export default {
  title: 'Loaders/CubeTexture',
  component: useCubeTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  const envMap = useCubeTexture(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], { path: 'cube/' })

  return (
    <>
      <Icosahedron args={[3, 4]}>
        <meshStandardMaterial envMap={envMap} attach="material" roughness={0} metalness={0.9} color="#010101" />
      </Icosahedron>
    </>
  )
}

function UseCubeTextureScene() {
  return (
    <Suspense fallback={null}>
      <TexturedMeshes />
    </Suspense>
  )
}

export const UseCubeTextureSceneSt = () => <UseCubeTextureScene />
UseCubeTextureSceneSt.story = {
  name: 'Default',
}

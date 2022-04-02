import * as React from 'react'

import { Setup } from '../Setup'

import { useCubeTexture, Icosahedron } from '../../src'

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
        <meshStandardMaterial envMap={envMap} roughness={0} metalness={0.9} color="#010101" />
      </Icosahedron>
    </>
  )
}

function UseCubeTextureScene() {
  return (
    <React.Suspense fallback={null}>
      <TexturedMeshes />
    </React.Suspense>
  )
}

export const UseCubeTextureSceneSt = () => <UseCubeTextureScene />
UseCubeTextureSceneSt.story = {
  name: 'Default',
}

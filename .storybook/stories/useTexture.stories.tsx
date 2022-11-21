import * as React from 'react'

import { Setup } from '../Setup'

import { Icosahedron, useTexture } from '../../src'

export default {
  title: 'Loaders/Texture',
  component: useTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  // a convenience hook that uses useLoader and TextureLoader
  const [matcap1, matcap2] = useTexture(['matcap-1.png', 'matcap-2.png'])

  // you can also use key: url objects:
  const props = useTexture({
    map: 'matcap-1.png',
    metalnessMap: 'matcap-2.png',
  })

  return (
    <>
      <Icosahedron position={[-2, 0, 0]}>
        <meshMatcapMaterial matcap={matcap1} />
      </Icosahedron>
      <Icosahedron position={[2, 0, 0]}>
        <meshMatcapMaterial matcap={matcap2} />
      </Icosahedron>
      <Icosahedron position={[6, 0, 0]}>
        <meshStandardMaterial {...props} metalness={1} />
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

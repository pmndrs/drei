import * as React from 'react'
import { Mesh, Vector3 } from 'three'

import { Setup } from '../Setup'

import { useGLTF, useMatcapTexture } from '../../src'

export default {
  title: 'Staging/useMatcapTexture',
  component: useMatcapTexture,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

function Suzanne({ textureIndex }: { textureIndex: number }) {
  const { nodes } = useGLTF('suzanne.glb', true) as any
  const [matcapTexture] = useMatcapTexture(textureIndex, 1024)

  return (
    <mesh geometry={(nodes.Suzanne as Mesh).geometry}>
      <meshMatcapMaterial matcap={matcapTexture} />
    </mesh>
  )
}

function UseMatcapTexture({ textureIndex, ...args }) {
  return (
    <React.Suspense fallback={null}>
      <Suzanne textureIndex={textureIndex} />
    </React.Suspense>
  )
}

export const UseMatcapTextureSt = (args) => <UseMatcapTexture {...args} />
UseMatcapTextureSt.story = {
  name: 'Default',
}
UseMatcapTextureSt.args = {
  textureIndex: 111,
}

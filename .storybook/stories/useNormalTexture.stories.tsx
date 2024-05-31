import * as React from 'react'

import { Mesh, Vector2, Vector3 } from 'three'

import { Setup } from '../Setup'
import { useGLTF, useNormalTexture } from '../../src'

export default {
  title: 'Staging/useNormalTexture',
  component: useNormalTexture,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

function Suzanne({
  textureRepeat,
  textureScale,
  textureIndex,
}: {
  textureRepeat: number
  textureScale: number
  textureIndex: number
}) {
  const { nodes } = useGLTF('suzanne.glb', true) as any
  const repeat = textureRepeat
  const scale = textureScale
  const [normalTexture] = useNormalTexture(textureIndex, {
    repeat: [repeat, repeat],
    anisotropy: 8,
  })

  return (
    <mesh geometry={(nodes.Suzanne as Mesh).geometry}>
      <meshStandardMaterial
        color="darkmagenta"
        roughness={0.9}
        metalness={0.1}
        normalScale={new Vector2(scale, scale)}
        normalMap={normalTexture}
      />
    </mesh>
  )
}

function UseNormalTexture({ textureRepeat, textureScale, textureIndex, ...args }) {
  return (
    <React.Suspense fallback={null}>
      <Suzanne textureRepeat={textureRepeat} textureScale={textureScale} textureIndex={textureIndex} />
    </React.Suspense>
  )
}

export const UseNormalTextureSt = (args) => <UseNormalTexture {...args} />
UseNormalTextureSt.story = {
  name: 'Default',
}
UseNormalTextureSt.args = {
  textureRepeat: 8,
  textureScale: 4,
  textureIndex: 3,
}

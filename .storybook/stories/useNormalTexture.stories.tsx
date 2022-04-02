import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { Mesh, Vector2, Vector3 } from 'three'

import { Setup } from '../Setup'
import { useGLTF, useNormalTexture } from '../../src'

export default {
  title: 'Staging/useNormalTexture',
  component: useNormalTexture,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

function Suzanne() {
  const { nodes } = useGLTF('suzanne.glb', true) as any
  const repeat = number('texture repeat', 8)
  const scale = number('texture scale', 4)
  const [normalTexture] = useNormalTexture(number('texture index', 3), {
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

function UseNormalTexture() {
  return (
    <React.Suspense fallback={null}>
      <Suzanne />
    </React.Suspense>
  )
}

export const UseNormalTextureSt = () => <UseNormalTexture />
UseNormalTextureSt.story = {
  name: 'Default',
}

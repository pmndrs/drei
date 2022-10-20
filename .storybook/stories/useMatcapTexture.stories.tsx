import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { Mesh, Vector3 } from 'three'

import { Setup } from '../Setup'

import { useGLTF, useMatcapTexture } from '../../src'

export default {
  title: 'Staging/useMatcapTexture',
  component: useMatcapTexture,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

function Suzanne() {
  const { nodes } = useGLTF('suzanne.glb', true) as any
  const [matcapTexture] = useMatcapTexture(number('texture index', 111), 1024)

  return (
    <mesh geometry={(nodes.Suzanne as Mesh).geometry}>
      <meshMatcapMaterial matcap={matcapTexture} />
    </mesh>
  )
}

function UseMatcapTexture() {
  return (
    <React.Suspense fallback={null}>
      <Suzanne />
    </React.Suspense>
  )
}

export const UseMatcapTextureSt = () => <UseMatcapTexture />
UseMatcapTextureSt.story = {
  name: 'Default',
}

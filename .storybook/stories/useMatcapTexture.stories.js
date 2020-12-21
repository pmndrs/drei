import * as React from 'react'

import { Setup } from '../Setup'
import { withKnobs, number } from '@storybook/addon-knobs'
import { useGLTF } from '../../src/useGLTF'
import { useMatcapTexture } from '../../src/useMatcapTexture'

export default {
  title: 'Prototyping/useMatcapTexture',
  component: useMatcapTexture,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={[0, 0, 3]}>{storyFn()}</Setup>],
}

function Suzanne() {
  const { nodes } = useGLTF('suzanne.glb', true)
  const [matcapTexture] = useMatcapTexture(
    number('texture index', 111),
    1024
  );

  return (
    <mesh geometry={nodes.Suzanne.geometry} >
        <meshMatcapMaterial
            attach="material"
            matcap={matcapTexture}
        />
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

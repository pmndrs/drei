import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Box, Ktx2, useGLTF, useKTX2 } from '../../src'
import { useThree } from '@react-three/fiber'
import { KTX2Loader } from 'three-stdlib'

export default {
  title: 'Loaders/Ktx2',
  component: Ktx2,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Ktx2>

type Story = StoryObj<typeof Ktx2>

function UseKTX2Scene(props: React.ComponentProps<typeof Ktx2>) {
  return (
    <Ktx2 {...props}>
      {(textures) => (
        <>
          <Box position={[-2, 0, 0]}>
            <meshBasicMaterial map={textures[0]} />
          </Box>
          <Box position={[2, 0, 0]}>
            <meshBasicMaterial map={textures[1]} />
          </Box>
        </>
      )}
    </Ktx2>
  )
}

export const UseKTX2SceneSt = {
  args: {
    input: ['sample_uastc_zstd.ktx2', 'sample_etc1s.ktx2'],
  },
  render: (args) => <UseKTX2Scene {...args} />,
  name: 'Default',
} satisfies Story

const ktx2Loader = new KTX2Loader()
ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.168.0/examples/jsm/libs/basis/')

function GLBCubeWith_KTX2({ ...props }) {
  const gl = useThree((s) => s.gl)
  const gltf = useGLTF('/box-textured-ktx2.glb', true, true, (loader) => {
    loader.setKTX2Loader(ktx2Loader.detectSupport(gl))
  })

  return <primitive object={gltf.scene} {...props}></primitive>
}

function SharingKTX2LoaderInstance(props: React.ComponentProps<typeof Ktx2>) {
  const texture = useKTX2('sample_uastc_zstd.ktx2', undefined, ktx2Loader)

  return (
    <>
      <GLBCubeWith_KTX2 position={[2, 0, 0]} />
      <Box position={[-2, 0, 0]}>
        <meshBasicMaterial map={texture} />
      </Box>
    </>
  )
}

export const GLB_and_useKTX_togheterSt2 = {
  args: {
    input: ['sample_uastc_zstd.ktx2', 'sample_etc1s.ktx2'],
  },
  render: (args) => <SharingKTX2LoaderInstance {...args} />,
  name: 'SharingKTX2LoaderInstance',
} satisfies Story

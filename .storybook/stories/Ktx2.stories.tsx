import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Box, Ktx2 } from '@react-three/drei'

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

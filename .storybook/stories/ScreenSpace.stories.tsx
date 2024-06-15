import * as React from 'react'
import { Box, OrbitControls, Html, ScreenSpace } from '../../src'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

export default {
  title: 'Abstractions/ScreenSpace',
  component: ScreenSpace,
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ScreenSpace>

type Story = StoryObj<typeof ScreenSpace>

function ScreenSpaceScene(props: React.ComponentProps<typeof ScreenSpace>) {
  return (
    <>
      <Box args={[1, 1, 1]}>
        <meshPhysicalMaterial />
      </Box>
      <ScreenSpace {...props}>
        <Box args={[0.1, 0.1, 0.1]} position={[0.5, 0.1, 0]}>
          <meshPhysicalMaterial color={'blue'} />
          <Html center sprite>
            <div style={{ color: 'hotpink' }}>Hi i'm in screen space</div>
          </Html>
        </Box>
      </ScreenSpace>

      <OrbitControls enablePan={true} zoomSpeed={0.5} />
    </>
  )
}

export const ScreenSpaceSt = {
  args: {
    depth: 1,
  },
  render: (args) => <ScreenSpaceScene {...args} />,
  name: 'Default',
} satisfies Story

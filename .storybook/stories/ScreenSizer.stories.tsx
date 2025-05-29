import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Box, Html, ScreenSizer } from '../../src'

import { Setup } from '../Setup'

export default {
  title: 'Abstractions/ScreenSizer',
  component: ScreenSizer,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ScreenSizer>

type Story = StoryObj<typeof ScreenSizer>

function ScreenSizerScene(props: React.ComponentProps<typeof ScreenSizer>) {
  return (
    <>
      <Box args={[1, 1, 1]} position={[-1, 0, 0]}>
        <meshPhysicalMaterial color="#69d2e7" />
        <Html
          center
          sprite
          style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.5)',
            pointerEvents: 'none',
            boxShadow: '0px 0px 10px 10px rgba(255,255,255, 0.5)',
          }}
        >
          Normal Box
        </Html>
      </Box>
      <ScreenSizer {...props} position={[1, 0, 0]}>
        <Box args={[100, 100, 100]}>
          <meshPhysicalMaterial color="#f38630" />
          <Html
            center
            sprite
            style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.5)',
              pointerEvents: 'none',
              boxShadow: '0px 0px 10px 10px rgba(255,255,255, 0.5)',
            }}
          >
            Box wrapped in ScreenSizer
          </Html>
        </Box>
      </ScreenSizer>
      <Html
        center
        sprite
        position={[0, -3, 0]}
        style={{
          textAlign: 'center',
          background: 'rgba(255,255,255,0.5)',
          pointerEvents: 'none',
          width: '10rem',
        }}
      >
        Zoom in/out to see the difference
      </Html>
    </>
  )
}

export const ScreenSizerSt = {
  args: {
    scale: 1,
  },
  render: (args) => <ScreenSizerScene {...args} />,
  name: 'Default',
} satisfies Story

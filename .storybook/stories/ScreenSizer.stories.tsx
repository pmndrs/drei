import * as React from 'react'
import { Vector3 } from 'three'
import { Box, Html, ScreenSizer } from '../../src'

import { Setup } from '../Setup'

export default {
  title: 'Abstractions/ScreenSizer',
  component: ScreenSizer,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 10)}>{storyFn()}</Setup>],
}

export const ScreenSizerStory = ({ scale }) => (
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
    <ScreenSizer scale={scale} position={[1, 0, 0]}>
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

ScreenSizerStory.args = {
  scale: 1,
}

import React from 'react'
import type { Preview } from '@storybook/react-vite'
import seedrandom from 'seedrandom'

import './index.css'

seedrandom('deterministic-random-for-storybook', { global: true }) // deterministic Math.random()

const preview: Preview = {
  globalTypes: {
    backend: {
      description: 'Backend to use by the renderer',
      toolbar: {
        icon: 'cpu',
        items: [
          { value: 'webgl', title: 'WebGL' },
          { value: 'webgpu', title: 'WebGPU' },
        ],
      },
    },
  },
  initialGlobals: {
    backend: 'webgl',
  },

  parameters: {
    layout: 'fullscreen',
    chromatic: {
      delay: 5000, // Wait 5s for assets to load before taking snapshot
    },
  },

  tags: ['autodocs'],
}
export default preview

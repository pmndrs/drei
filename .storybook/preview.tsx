import React from 'react'
import type { Preview } from '@storybook/react-vite'
import seedrandom from 'seedrandom'

import './index.css'

seedrandom('deterministic-random-for-storybook', { global: true }) // deterministic Math.random()

// NOTE: there used to be a second `globalTypes`/`initialGlobals` pair here
// declaring a `backend` toolbar (webgl/webgpu, defaulting to webgl). It arrived
// from master's #2593 when master was merged into v11-working, alongside v11's
// own `renderer` toolbar. Duplicate keys in one object literal mean the last
// wins, so `backend` never existed at runtime — and nothing reads
// `globals.backend`, while `context.globals.renderer` is used across the
// stories. Removed. See #2807.
const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: {
        transform: (code: string) => {
          // Extract just the JSX from render functions
          const renderMatch = code.match(/render:\s*(?:\([^)]*\)\s*)?=>\s*(\([\s\S]*\)|<[\s\S]*>)/)
          if (renderMatch) {
            return renderMatch[1]
          }
          return code
        },
      },
    },
  },
  globalTypes: {
    renderer: {
      description: 'which of the renderers to use',
      toolbar: {
        icon: 'cpu',
        items: [
          { value: 'legacy', title: 'Legacy' },
          { value: 'webgpu', title: 'WebGPU' },
        ],
      },
    },
  },
  initialGlobals: {
    renderer: 'webgpu',
  },

  tags: ['autodocs'],
}
export default preview

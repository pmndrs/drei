import React from 'react'
import type { Preview } from '@storybook/react-vite'

import './index.css'

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

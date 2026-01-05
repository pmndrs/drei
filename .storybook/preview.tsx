import React from 'react'
import type { Preview } from '@storybook/react-vite'
import isChromatic from 'chromatic/isChromatic'
import seedrandom from 'seedrandom'

import './index.css'

// Set deterministic random seed for Chromatic snapshots
seedrandom('chromatic-seed', { global: true })

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },

  tags: ['autodocs'],
}
export default preview

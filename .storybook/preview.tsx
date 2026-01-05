import React from 'react'
import type { Preview } from '@storybook/react-vite'
import seedrandom from 'seedrandom'

import './index.css'

seedrandom('deterministic-random-for-storybook', { global: true }) // deterministic Math.random()

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    chromatic: { delay: 5000 }, // Wait 5s before taking snapshot
  },

  tags: ['autodocs'],
}
export default preview

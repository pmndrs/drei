import React from 'react'
import type { Preview } from '@storybook/react-vite'
import seedrandom from 'seedrandom'

import './index.css'

seedrandom('deterministic-random-for-storybook', { global: true }) // deterministic Math.random()

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },

  tags: ['autodocs'],
}
export default preview

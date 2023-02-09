import React from 'react'
import './index.css'

export const parameters = {
  layout: 'fullscreen',
}

export const decorators = [
  (Story) => (
    <React.Suspense fallback={null}>
      <Story />
    </React.Suspense>
  ),
]

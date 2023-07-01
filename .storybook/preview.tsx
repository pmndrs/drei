import React from 'react'
import type { Preview } from '@storybook/react'

import './index.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true },
  },
  decorators: [
    (Story) => (
      <React.Suspense fallback={null}>
        <Story />
      </React.Suspense>
    ),
  ],
}
export default preview

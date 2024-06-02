import type { StorybookConfig } from '@storybook/react-vite'
import { svg } from './favicon'

const config: StorybookConfig = {
  staticDirs: ['./public'],
  stories: ['./stories/**/*.stories.{ts,tsx}'],
  addons: ['@storybook/addon-essentials', '@chromatic-com/storybook'],

  // Favicon (inline svg https://stackoverflow.com/questions/66935329/use-inline-svg-as-favicon)
  managerHead: (head) => `
    ${head}
    <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
      svg(process.env.NODE_ENV === 'development' ? 'development' : undefined)
    )}">
  `,

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {},

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
}

export default config

import type { StorybookConfig } from '@storybook/react-vite'
import { svg } from './favicon.ts'

const config: StorybookConfig = {
  staticDirs: ['./public'],
  stories: ['./stories/**/*.stories.{ts,tsx}'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs'],

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
    reactDocgenTypescriptOptions: {
      propFilter: (prop, component) => {
        // Only include props that belong to the current component
        const fileName = prop.declarations?.at(0)?.fileName // 'drei/src/core/AccumulativeShadows.tsx'
        const componentName = fileName?.split('/').at(-1)?.split('.').at(0) // 'AccumulativeShadows'
        return component.name === componentName
      },
    },
  },

  async viteFinal(config) {
    // In production build mode with USE_BUILT_PACKAGE env var, use the built package
    if (config.mode === 'production' && process.env.USE_BUILT_PACKAGE === 'true') {
      const path = await import('path')
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        // Point to the built package instead of /src
        '../../src': path.resolve(__dirname, '../dist'),
        '../src': path.resolve(__dirname, '../dist'),
      }
      console.log('📦 Using built package from /dist for Storybook build')
    }
    return config
  },
}

export default config

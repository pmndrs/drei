import type { StorybookConfig } from '@storybook/react-vite'
import { svg } from './favicon'
import path from 'path'

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
    reactDocgenTypescriptOptions: {
      propFilter: (prop, component) => {
        // Only include props that belong to the current component
        const fileName = prop.declarations?.at(0)?.fileName // 'drei/src/core/AccumulativeShadows.tsx'
        const componentName = fileName?.split('/').at(-1)?.split('.').at(0) // 'AccumulativeShadows'
        return component.name === componentName
      },
    },
  },

  viteFinal: async (config) => {
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-three/drei':
        process.env.STORYBOOK_ENV === 'production'
          ? path.resolve(__dirname, '../dist')
          : path.resolve(__dirname, '../src'),
    }
    return config
  },
}

export default config

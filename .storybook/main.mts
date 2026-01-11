import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/react-vite'
import { svg } from './favicon.ts'
import { mergeConfig } from 'vite'
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  staticDirs: ['./public'],
  stories: [
    '../src/**/*.stories.{ts,tsx}',          // Co-located stories
    // Exclude broken stories (missing components)
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    "@storybook/addon-vitest",
    "storybook-addon-tag-badges",
  ],

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

  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          // Storybook-specific aliases
          '@sb': path.resolve(__dirname, '.'),
          'drei': path.resolve(__dirname, './drei-barrel.ts'),

          // Project path aliases (from tsconfig)
          '#three': 'three',
          '#three-addons': path.resolve(__dirname, '../src/utils/three-addons'),
          '#drei-platform': path.resolve(__dirname, '../src/utils/drei-platform'),
          '@core': path.resolve(__dirname, '../src/core'),
          '@legacy': path.resolve(__dirname, '../src/legacy'),
          '@webgpu': path.resolve(__dirname, '../src/webgpu'),
          '@external': path.resolve(__dirname, '../src/external'),
          '@experimental': path.resolve(__dirname, '../src/experimental'),
          '@utils': path.resolve(__dirname, '../src/utils'),
        },
      },
    })
  },

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
}

export default config

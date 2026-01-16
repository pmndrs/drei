import type { StorybookConfig } from '@storybook/react-vite'
import { svg } from './favicon.ts'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    // Always use vite-tsconfig-paths plugin for TypeScript path resolution
    config.plugins = config.plugins || []
    config.plugins.push(tsconfigPaths())
    
    // In production build with USE_BUILT_PACKAGE env var, override to use the built package
    if (process.env.USE_BUILT_PACKAGE === 'true') {
      const distPath = path.resolve(__dirname, '../dist')
      
      // Override the @react-three/drei alias to point to dist instead of src
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-three/drei': distPath,
        // Also handle subpath imports like @react-three/drei/web/Html
        // Using string concatenation here because this is an alias pattern, not a file path
        '@react-three/drei/': distPath + '/',
      }
      console.log('📦 Using built package from /dist for Storybook build')
    } else {
      console.log('🔧 Using source from /src for Storybook development')
    }
    
    return config
  },
}

export default config

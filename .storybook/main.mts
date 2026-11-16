import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import type { StorybookConfig } from '@storybook/react-vite'
import { svg } from './favicon.ts'
import { mergeConfig, type Plugin } from 'vite'
import path, { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const useBuiltPackage = process.env.USE_BUILT_PACKAGE === 'true'

//* Platform aliases ==============================
// The renderer toolbar switches the Canvas at runtime, but #three / #three-addons / #drei-platform
// are build-time, so one Storybook build serves one alias set (#2875). DREI_RENDERER picks it,
// matching build.config.ts: `webgpu` (default) is what the root, core and /webgpu entries ship;
// `legacy` is what the /legacy entry ships. Files under src/legacy/ only ever ship in the WebGL
// build, so they get its aliases in both modes.
const rendererBuild: 'webgpu' | 'legacy' = process.env.DREI_RENDERER === 'legacy' ? 'legacy' : 'webgpu'
const legacyDir = path.resolve(__dirname, '../src/legacy') + path.sep
const platformAliases = {
  legacy: {
    '#three': 'three',
    '#three-addons': path.resolve(__dirname, '../src/utils/three-addons.ts'),
    '#drei-platform': path.resolve(__dirname, '../src/utils/drei-platform.ts'),
  },
  webgpu: {
    '#three': 'three/webgpu',
    '#three-addons': path.resolve(__dirname, '../src/utils/three-addons-webgpu.ts'),
    '#drei-platform': path.resolve(__dirname, '../src/utils/drei-platform-webgpu.ts'),
  },
} as const

function platformAliasPlugin(): Plugin {
  return {
    name: 'drei-platform-aliases',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source !== '#three' && source !== '#three-addons' && source !== '#drei-platform') return null
      const build = importer?.startsWith(legacyDir) ? 'legacy' : rendererBuild
      return this.resolve(platformAliases[build][source], importer, { ...options, skipSelf: true })
    },
  }
}

// Build-time replacements (mirrors build.config.ts)
const mediapipeVersion = JSON.parse(
  readFileSync(path.resolve(__dirname, '../node_modules/@mediapipe/tasks-vision/package.json'), 'utf8')
).version

const config: StorybookConfig = {
  staticDirs: ['./public'],
  stories: [
    '../src/**/*.stories.{ts,tsx}', // Co-located stories
    // Exclude broken stories (missing components)
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    'storybook-addon-tag-badges',
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
    // Conditional aliasing: use built dist/ for Chromatic, source for dev
    const dreiAlias = useBuiltPackage
      ? path.resolve(__dirname, '../dist/index.mjs')
      : path.resolve(__dirname, './drei-barrel.ts')

    console.log(`[storybook] Using ${useBuiltPackage ? 'BUILT package (dist/)' : 'SOURCE (src/)'}`)
    console.log(`[storybook] Platform aliases: ${rendererBuild} (set DREI_RENDERER=legacy for the WebGL build)`)

    return mergeConfig(config, {
      build: { target: 'es2022' },
      plugins: [platformAliasPlugin()],
      define: {
        __MEDIAPIPE_TASKS_VISION_VERSION__: JSON.stringify(mediapipeVersion),
        __DREI_RENDERER__: JSON.stringify(rendererBuild),
      },
      resolve: {
        alias: {
          // Storybook-specific aliases
          '@sb': path.resolve(__dirname, '.'),
          drei: dreiAlias,
          '@react-three/drei': dreiAlias,

          // Project path aliases (from tsconfig)
          // These always point to source — dist only has flat bundles,
          // not individual component files. #three, #three-addons and #drei-platform are
          // resolved per importer by platformAliasPlugin above.
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

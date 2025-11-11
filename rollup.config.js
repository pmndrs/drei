import path from 'path'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import glslify from 'rollup-plugin-glslify'
import multiInput from 'rollup-plugin-multi-input'
import { terser } from 'rollup-plugin-terser'
import webgpuOverrideResolver from './rollup-plugin-webgpu-overrides.js'

const root = process.platform === 'win32' ? path.resolve('/') : '/'
const external = (id) => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json']

const getBabelOptions = ({ useESModules }) => ({
  babelrc: false,
  extensions,
  exclude: '**/node_modules/**',
  babelHelpers: 'runtime',
  presets: [
    [
      '@babel/preset-env',
      {
        include: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-numeric-separator',
          '@babel/plugin-proposal-logical-assignment-operators',
        ],
        bugfixes: true,
        loose: true,
        modules: false,
        targets: '> 1%, not dead, not ie 11, not op_mini all',
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    ['@babel/transform-runtime', { regenerator: false, useESModules }],
  ],
})

/**
 * Creates a build configuration
 * @param {Object} options - Build options
 * @param {boolean} options.isWebGPU - Whether this is a WebGPU build
 * @param {string} options.format - Output format ('esm' or 'cjs')
 * @param {boolean} options.multiFiles - Whether to use multi-input (multiple entry points)
 * @returns {Object} Rollup configuration
 */
function createConfig({ isWebGPU = false, format = 'esm', multiFiles = true }) {
  const useESModules = format === 'esm'
  const outputDir = isWebGPU ? 'dist/webgpu' : 'dist'
  const input = multiFiles ? ['src/**/*.ts', 'src/**/*.tsx', '!src/index.ts', '!src/webgpu/**'] : './src/index.ts'

  const plugins = [
    // For WebGPU builds, resolve internal file overrides first
    ...(isWebGPU ? [webgpuOverrideResolver({ verbose: false })] : []),

    // For WebGPU builds, alias 'three' imports to 'three/webgpu'
    ...(isWebGPU
      ? [
          alias({
            entries: [{ find: /^three$/, replacement: 'three/webgpu' }],
          }),
        ]
      : []),

    // Standard plugins
    ...(multiFiles
      ? [
          multiInput(
            format === 'cjs' ? { transformOutputPath: (output) => output.replace(/\.[^/.]+$/, '.cjs.js') } : undefined
          ),
        ]
      : []),
    json(),
    glslify(),
    babel(getBabelOptions({ useESModules })),
    resolve({ extensions }),
    ...(format === 'cjs' ? [terser()] : []),
  ]

  const output =
    format === 'esm'
      ? multiFiles
        ? { dir: outputDir, format: 'esm' }
        : { dir: outputDir, format: 'esm', preserveModules: true }
      : multiFiles
        ? { dir: outputDir, format: 'cjs' }
        : { file: `${outputDir}/index.cjs.js`, format: 'cjs' }

  return {
    input,
    output,
    external,
    plugins,
    ...(format === 'esm' && !multiFiles ? { preserveModules: true } : {}),
  }
}

export default [
  //* WebGL builds (default) ==============================

  // ESM multi-file build
  createConfig({ format: 'esm', multiFiles: true }),

  // ESM single entry with preserved modules
  createConfig({ format: 'esm', multiFiles: false }),

  // CJS multi-file build (minified)
  createConfig({ format: 'cjs', multiFiles: true }),

  // CJS single entry (minified)
  createConfig({ format: 'cjs', multiFiles: false }),

  //* WebGPU builds ==============================

  // ESM multi-file build
  createConfig({ isWebGPU: true, format: 'esm', multiFiles: true }),

  // ESM single entry with preserved modules
  createConfig({ isWebGPU: true, format: 'esm', multiFiles: false }),

  // CJS multi-file build (minified)
  createConfig({ isWebGPU: true, format: 'cjs', multiFiles: true }),

  // CJS single entry (minified)
  createConfig({ isWebGPU: true, format: 'cjs', multiFiles: false }),
]

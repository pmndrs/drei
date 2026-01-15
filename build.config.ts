//* Build Configuration ==============================
// Drei uses per-entry alias configuration for WebGL/WebGPU builds.
// Each entry gets the correct #three alias via rolldown's resolve.alias.
//
// - Root, Core, External, Experimental, Legacy: #three → 'three'
// - WebGPU, Native: #three → 'three/webgpu'

import { defineBuildConfig } from 'obuild/config'
import { resolve } from 'path'

//* Internal Path Aliases ==============================
// These resolve @core, @legacy, etc. imports to actual paths

const internalAliases = {
  '@core': resolve('./src/core'),
  '@legacy': resolve('./src/legacy'),
  '@webgpu': resolve('./src/webgpu'),
  '@external': resolve('./src/external'),
  '@experimental': resolve('./src/experimental'),
  '@utils': resolve('./src/utils'),
}

//* Platform Alias Configurations ==============================

const webglAliases = {
  ...internalAliases,
  '#three': 'three',
  '#drei-platform': resolve('./src/utils/drei-platform.ts'),
  '#three-addons': resolve('./src/utils/three-addons.ts'),
}

const webgpuAliases = {
  ...internalAliases,
  '#three': 'three/webgpu',
  '#drei-platform': resolve('./src/utils/drei-platform-webgpu.ts'),
  '#three-addons': resolve('./src/utils/three-addons-webgpu.ts'),
}

//* Shared Configuration ==============================

const sharedRolldownConfig = {
  treeshake: true,
  platform: 'browser' as const, // Use browser-compatible CJS interop (avoids node:module)
  output: {
    format: 'esm' as const,
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  external: (id: string) => {
    if (id.startsWith('three') || id.startsWith('@react-three') || id.startsWith('react')) return true
    return false
  },
}

//* Build Configuration ==============================

export default defineBuildConfig({
  cwd: '.',

  entries: [
    //* WebGL Entries (use plain 'three') ==============================

    // Root entry - core + external + experimental
    {
      type: 'bundle',
      input: './src/index.ts',
      outDir: './dist',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webglAliases },
      },
    },

    // Core entry - renderer-agnostic components
    {
      type: 'bundle',
      input: './src/core/index.ts',
      outDir: './dist/core',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webglAliases },
      },
    },

    // External entry - third-party library wrappers
    {
      type: 'bundle',
      input: './src/external/index.ts',
      outDir: './dist/external',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webglAliases },
      },
    },

    // Experimental entry - rough/experimental components
    {
      type: 'bundle',
      input: './src/experimental/index.ts',
      outDir: './dist/experimental',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webglAliases },
      },
    },

    // Legacy entry - core + WebGL-only implementations
    {
      type: 'bundle',
      input: './src/legacy/index.ts',
      outDir: './dist/legacy',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webglAliases },
      },
    },

    //* WebGPU Entries (use 'three/webgpu') ==============================

    // WebGPU entry - core + WebGPU-only implementations
    {
      type: 'bundle',
      input: './src/webgpu/index.ts',
      outDir: './dist/webgpu',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webgpuAliases },
      },
    },

    // Native entry - core + WebGPU for React Native
    {
      type: 'bundle',
      input: './src/native/index.ts',
      outDir: './dist/native',
      dts: true,
      rolldown: {
        ...sharedRolldownConfig,
        resolve: { alias: webgpuAliases },
      },
    },
  ],
})

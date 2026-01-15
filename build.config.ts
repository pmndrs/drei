//* Build Configuration ==============================
// Drei uses unbuild (Rollup) for bundling.
// Each entry gets platform-specific aliases via separate build configs.
//
// - Root, Core, External, Experimental, Legacy: #three → 'three'
// - WebGPU, Native: #three → 'three/webgpu'
//
// Why Rollup over Rolldown?
// Rolldown has a bug where it resolves external dependencies to absolute paths
// (e.g., C:\...\node_modules\three\...) instead of keeping clean specifiers.
// This breaks portability and causes duplicate instances in consuming apps.

import { defineBuildConfig } from 'unbuild';
import { resolve } from 'path';
import alias from '@rollup/plugin-alias';

//* Internal Path Aliases ==============================
// These resolve @core, @legacy, etc. imports to actual paths

const internalAliases = [
  { find: '@core', replacement: resolve('./src/core') },
  { find: '@legacy', replacement: resolve('./src/legacy') },
  { find: '@webgpu', replacement: resolve('./src/webgpu') },
  { find: '@external', replacement: resolve('./src/external') },
  { find: '@experimental', replacement: resolve('./src/experimental') },
  { find: '@utils', replacement: resolve('./src/utils') },
];

//* Platform Alias Configurations ==============================

const webglAliases = [
  ...internalAliases,
  { find: '#three', replacement: 'three' },
  { find: '#drei-platform', replacement: resolve('./src/utils/drei-platform.ts') },
  { find: '#three-addons', replacement: resolve('./src/utils/three-addons.ts') },
];

const webgpuAliases = [
  ...internalAliases,
  { find: '#three', replacement: 'three/webgpu' },
  { find: '#drei-platform', replacement: resolve('./src/utils/drei-platform-webgpu.ts') },
  { find: '#three-addons', replacement: resolve('./src/utils/three-addons-webgpu.ts') },
];

//* External Dependencies ==============================
// Peer dependencies should not be bundled

const externals = [
  'three',
  /^three\//,
  '@react-three/fiber',
  /^@react-three\//,
  'react',
  /^react\//,
  'react-dom',
  /^react-dom\//,
];

//* Build Configuration ==============================

export default defineBuildConfig([
  //* WebGL Entries (use plain 'three') ==============================

  // Root entry - core + external + experimental
  {
    entries: [{ input: './src/index.ts', name: 'index' }],
    outDir: './dist',
    declaration: true,
    clean: true,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webglAliases }));
      },
    },
    externals,
  },

  // Core entry - renderer-agnostic components
  {
    entries: [{ input: './src/core/index.ts', name: 'index' }],
    outDir: './dist/core',
    declaration: true,
    clean: false,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webglAliases }));
      },
    },
    externals,
  },

  // External entry - third-party library wrappers
  {
    entries: [{ input: './src/external/index.ts', name: 'index' }],
    outDir: './dist/external',
    declaration: true,
    clean: false,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webglAliases }));
      },
    },
    externals,
  },

  // Experimental entry - rough/experimental components
  {
    entries: [{ input: './src/experimental/index.ts', name: 'index' }],
    outDir: './dist/experimental',
    declaration: true,
    clean: false,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webglAliases }));
      },
    },
    externals,
  },

  // Legacy entry - core + WebGL-only implementations
  {
    entries: [{ input: './src/legacy/index.ts', name: 'index' }],
    outDir: './dist/legacy',
    declaration: true,
    clean: false,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webglAliases }));
      },
    },
    externals,
  },

  //* WebGPU Entries (use 'three/webgpu') ==============================

  // WebGPU entry - core + WebGPU-only implementations
  {
    entries: [{ input: './src/webgpu/index.ts', name: 'index' }],
    outDir: './dist/webgpu',
    declaration: true,
    clean: false,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webgpuAliases }));
      },
    },
    externals,
  },

  // Native entry - core + WebGPU for React Native
  {
    entries: [{ input: './src/native/index.ts', name: 'index' }],
    outDir: './dist/native',
    declaration: true,
    clean: false,
    failOnWarn: false,
    rollup: {
      emitCJS: false,
      esbuild: {
        target: 'esnext',
      },
    },
    hooks: {
      'rollup:options': (ctx, options) => {
        options.plugins = options.plugins || [];
        (options.plugins as any[]).unshift(alias({ entries: webgpuAliases }));
      },
    },
    externals,
  },
]);

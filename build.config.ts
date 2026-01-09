import { defineBuildConfig } from 'obuild'

export default defineBuildConfig({
  entries: [
    //* Root entry - core + external + experimental ==============================
    {
      input: './src/index',
      name: 'index',
      builder: 'rolldown',
      declaration: true,
    },

    //* Core entry - production-ready, renderer-agnostic ==============================
    {
      input: './src/core/index',
      name: 'core/index',
      builder: 'rolldown',
      declaration: true,
    },

    //* External entry - external library wrappers ==============================
    {
      input: './src/external/index',
      name: 'external/index',
      builder: 'rolldown',
      declaration: true,
    },

    //* Experimental entry - rough/experimental components ==============================
    {
      input: './src/experimental/index',
      name: 'experimental/index',
      builder: 'rolldown',
      declaration: true,
    },

    //* Legacy entry - WebGL-only implementations ==============================
    {
      input: './src/legacy/index',
      name: 'legacy/index',
      builder: 'rolldown',
      declaration: true,
    },

    //* WebGPU entry - WebGPU-only implementations ==============================
    {
      input: './src/webgpu/index',
      name: 'webgpu/index',
      builder: 'rolldown',
      declaration: true,
    },

    //* Native entry - React Native support ==============================
    {
      input: './src/native/index',
      name: 'native/index',
      builder: 'rolldown',
      declaration: true,
    },
  ],

  // Output configuration
  outDir: './dist',
  clean: true,

  // External dependencies - don't bundle these
  externals: [
    'react',
    'react-dom',
    'three',
    'three/webgpu',
    'three/tsl',
    '@react-three/fiber',
    '@babel/runtime',
    '@mediapipe/tasks-vision',
    '@monogrid/gainmap-js',
    '@use-gesture/react',
    'camera-controls',
    'detect-gpu',
    'glsl-noise',
    'hls.js',
    'maath',
    'meshline',
    'stats-gl',
    'stats.js',
    'suspend-react',
    'three-mesh-bvh',
    'three-stdlib',
    'troika-three-text',
    'tunnel-rat',
    'use-sync-external-store',
    'utility-types',
    'zustand',
  ],

  // Rolldown-specific options
  rolldown: {
    // Alias configuration for #three
    alias: {
      // For root, core, external, experimental: #three → 'three'
      '#three': 'three',
    },

    // Enable tree-shaking
    treeshake: true,

    // Output formats
    output: {
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },

    // External handling
    external: (id) => {
      // External all peer dependencies and dependencies
      if (id.startsWith('three') || id.startsWith('@react-three') || id.startsWith('react')) {
        return true
      }
      return false
    },
  },

  // TypeScript declaration generation
  declaration: true,

  // Fail on warnings
  failOnWarn: false,
})



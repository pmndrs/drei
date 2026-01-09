import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isWebGPU = mode === 'webgpu'
  
  console.log(`\n🎮 Running in ${isWebGPU ? 'WebGPU' : 'Legacy (WebGL)'} mode\n`)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Examples app internal alias
        '@ex': path.resolve(__dirname, './src'),
        // Alias to local drei source for live development
        '@react-three/drei/core': path.resolve(__dirname, '../src/core'),
        '@react-three/drei/legacy': path.resolve(__dirname, '../src/legacy'),
        '@react-three/drei/webgpu': path.resolve(__dirname, '../src/webgpu'),
        '@react-three/drei/external': path.resolve(__dirname, '../src/external'),
        '@react-three/drei/experimental': path.resolve(__dirname, '../src/experimental'),
        '@react-three/drei': path.resolve(__dirname, '../src'),
        // Ensure three resolves correctly
        '#three': isWebGPU ? 'three/webgpu' : 'three',
        // Split addons based on mode
        '#three-addons': path.resolve(__dirname, isWebGPU 
          ? '../src/utils/three-addons-webgpu' 
          : '../src/utils/three-addons'),
        // Split drei components based on mode
        '#drei-platform': path.resolve(__dirname, isWebGPU 
          ? '../src/utils/drei-platform-webgpu' 
          : '../src/utils/drei-platform'),
        // Internal aliases for cleaner imports
        '@core': path.resolve(__dirname, '../src/core'),
        '@legacy': path.resolve(__dirname, '../src/legacy'),
        '@webgpu': path.resolve(__dirname, '../src/webgpu'),
        '@external': path.resolve(__dirname, '../src/external'),
        '@experimental': path.resolve(__dirname, '../src/experimental'),
        '@utils': path.resolve(__dirname, '../src/utils'),
      },
      // Dedupe three.js to prevent multiple instances
      // This is temporary until r3f alpha is replaced with proper peer dependencies
      dedupe: ['three', '@react-three/fiber'],
    },
    server: {
      port: 3000,
      open: true,
    },
  }
})

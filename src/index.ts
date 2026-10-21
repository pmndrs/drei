//* Root Entry Point ==============================
// Includes: core + external + experimental, using Fiber's default WebGPU renderer.
// For WebGL, import shared components from /legacy as well.

export * from './core'
export * from './external'
export * from './experimental'

// Note: legacy and webgpu are NOT included in root export
// Import them explicitly:
//   import { ... } from '@react-three/drei/legacy'
//   import { ... } from '@react-three/drei/webgpu'

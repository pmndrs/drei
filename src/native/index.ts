//* Native Entry Point ==============================
// This entry exports drei components for React Native with WebGPU aliasing.
// When built, all #three imports resolve to 'three/webgpu'.
//
// IMPORTANT: Some components don't work on React Native and are excluded or stubbed.
// - HTML: Requires DOM, not available on native
// - Caustics: Complex WebGPU effects not yet supported on native
//
// Usage: import { Box, MeshDistortMaterial } from '@react-three/drei/native'

//* Helper for unsupported components ==============================
function createUnsupportedComponent(name: string, reason: string) {
  return function UnsupportedComponent() {
    throw new Error(`[drei/native] ${name} is not supported: ${reason}`)
  }
}

//* Core Components (renderer-agnostic, aliased to three/webgpu) ==============================
export * from '../core'

//* WebGPU-specific implementations (override core where applicable) ==============================
export * from '../webgpu'

//* Exclusions - Components that don't work on React Native ==============================
// These override the exports above with stubs that throw helpful errors

// HTML requires DOM and won't work on native
export const Html = createUnsupportedComponent('Html', 'HTML requires DOM which is not available on React Native')

// Caustics is too complex for native currently
export const Caustics = createUnsupportedComponent('Caustics', 'Caustics is not yet supported on React Native')

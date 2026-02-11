//* Legacy Entry Point ==============================
// This entry exports ALL drei components with WebGL aliasing.
// When built, all #three imports resolve to plain 'three'.
// NO 'three/webgpu' or 'three/tsl' imports should appear in this bundle.
//
// Usage: import { Box, MeshDistortMaterial } from '@react-three/drei/legacy'

//* Core Components (renderer-agnostic, aliased to plain three) ==============================
export * from '../core'

//* Legacy-specific implementations (override core where applicable) ==============================
// Note: Portal exports excluded as they duplicate core exports (Hud, RenderCubeTexture, RenderTexture)
export * from './Abstractions'
export * from './Geometry'
export * from './Materials'
export * from './Staging'
export * from './Effects'
export * from './UI'

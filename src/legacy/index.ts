//* Legacy Entry Point ==============================
// WebGL-only implementations

export * from './Portal'
export * from './Abstractions'
export * from './Materials'
export * from './Staging'
export * from './Effects'
export * from './UI'

//* Core Components (use platform-aliased materials) ==============================
export { Cloud, Clouds, CloudInstance } from '../core/Effects/Cloud/Cloud'
export type { CloudProps, CloudsProps } from '../core/Effects/Cloud/Cloud'
//export { Edges } from '../core/Geometry/Edges/Edges'
//export type { EdgesProps } from '../core/Geometry/Edges/Edges'

// Note: Sparkles is exported from ./Effects (uses Points geometry, WebGL only)


//* WebGPU Entry Point ==============================
// WebGPU-only implementations

export * from './Materials'
export * from './UI'
export * from './Staging'
export * from './Effects'

//* Core Components (use platform-aliased materials) ==============================
export { Cloud, Clouds, CloudInstance } from '../core/Effects/Cloud/Cloud'
export type { CloudProps, CloudsProps } from '../core/Effects/Cloud/Cloud'

// Note: Sparkles is exported from ./Effects (uses instanced quads, not Points)



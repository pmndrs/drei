//* Legacy Entry Point ==============================
// WebGL-only implementations

export * from './Portal'
export * from './Abstractions'
export * from './Materials'
export * from './Staging'

//* Core Components (use platform-aliased materials) ==============================
export { Cloud, Clouds, CloudInstance } from '../core/Effects/Cloud/Cloud'
export type { CloudProps, CloudsProps } from '../core/Effects/Cloud/Cloud'


//* Trail Component - Platform Re-export ==============================
// This file re-exports the platform-specific Trail implementation.
// WebGL builds get legacy/Effects/Trail, WebGPU builds get webgpu/Effects/Trail.

export { Trail, useTrail } from '#drei-platform'
export type { TrailProps } from '#drei-platform'

//* SoftShadows Stub - WebGPU Not Yet Supported ==============================
// This stub provides types and a placeholder component for WebGPU builds.
// The full SoftShadows implementation uses ShaderChunk to inject PCSS shaders
// which is WebGL-only. When converted to TSL, this stub will be replaced.

import * as React from 'react'

export type SoftShadowsProps = {
  /** Size of the light source (the larger the softer the light), default: 25 */
  size?: number
  /** Number of samples (more samples less noise but more expensive), default: 10 */
  samples?: number
  /** Depth focus, use it to shift the focal point (scaled in three units), default: 0 (the beginning) */
  focus?: number
}

let hasWarned = false
function warnOnce(message: string) {
  if (!hasWarned) {
    console.warn(message)
    hasWarned = true
  }
}

export function SoftShadows(props: SoftShadowsProps) {
  warnOnce(
    'drei: SoftShadows is not yet supported in WebGPU. ' +
      'It uses ShaderChunk to inject PCSS shaders which is WebGL-only. ' +
      'Import from @react-three/drei/legacy for WebGL.'
  )
  return null
}

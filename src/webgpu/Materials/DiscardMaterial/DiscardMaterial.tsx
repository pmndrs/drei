/**
 * DiscardMaterial for WebGPU
 * Uses MeshBasicNodeMaterial but discards all fragments using TSL.
 * Used to make objects invisible while still casting shadows during FBO renders.
 */

import { Fn, Discard, vec4 } from 'three/tsl'
import { MeshBasicNodeMaterial } from 'three/webgpu'

// Discard() is a control flow operation, not a value node.
// We wrap it in Fn() and return a vec4 for type correctness (never reached).
const discardFragment = /* @__PURE__ */ Fn(() => {
  Discard()
  return vec4(0, 0, 0, 0)
})

/**
 * Constructible form of the discard material.
 *
 * `DiscardMaterial` below is a process-wide singleton that internal consumers
 * (MeshTransmissionMaterial, AccumulativeShadows) swap onto a mesh for the
 * duration of an FBO pass. Anything that needs its own instance — notably the
 * `<MeshDiscardMaterial />` JSX wrapper, where each element owns its material —
 * constructs this class instead.
 */
export class DiscardNodeMaterial extends MeshBasicNodeMaterial {
  constructor() {
    super()
    this.fragmentNode = discardFragment()
  }
}

export const DiscardMaterial = /* @__PURE__ */ new DiscardNodeMaterial()

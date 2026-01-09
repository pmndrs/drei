//* TODO: Convert GLSL shaders to TSL for WebGPU ==============================


/**
 * DiscardMaterial for WebGPU
 * Uses MeshBasicMaterial but discards all fragments using TSL NodeMaterial.
 */

import { Discard } from 'three/tsl'
import { MeshBasicNodeMaterial } from 'three/webgpu'

export const DiscardMaterial = /* @__PURE__ */ new MeshBasicNodeMaterial({
  colorNode: Discard()
})


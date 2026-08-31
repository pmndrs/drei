/*
  PCSS (Percentage Closer Soft Shadows) Shadow Node for WebGPU

  Inspired by:
    https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shadowmap_pcss.html
    https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-17-efficient-soft-edged-shadows-using

  Concept:
    https://www.gamedev.net/tutorials/programming/graphics/contact-hardening-soft-shadows-made-fast-r4906/
*/

import { ShadowNode, Light } from 'three/webgpu'
import {
  Fn,
  float,
  int,
  vec2,
  texture,
  step,
  reference,
  renderGroup,
  screenCoordinate,
  interleavedGradientNoise,
  vogelDiskSample,
} from 'three/tsl'

export type PCSSShadowNodeOptions = {
  /** Size of the light source (the larger the softer the light), default: 25 */
  size?: number
  /** Number of samples (more samples less noise but more expensive), default: 10 */
  samples?: number
  /** Depth focus, use it to shift the focal point (where the shadow is the sharpest), default: 0 */
  focus?: number
}

/**
 * Creates a PCSS filter function for use with shadow nodes.
 * Uses raw depth sampling (no hardware comparison) since PCSS needs to read actual depth values.
 */
const createPCSSFilter = (size: number, samples: number, focus: number) => {
  const sampleCount = Math.min(Math.max(samples, 1), 20)

  return Fn(({ depthTexture, shadowCoord, shadow, depthLayer }: any) => {
    // Raw depth sampling in [0,1] range (no comparison sampler - we disabled compareFunction)
    const sampleDepth = (uv: any) => {
      const tex = texture(depthTexture, uv) as any
      const depth = depthTexture.isArrayTexture ? tex.depth(depthLayer) : tex
      return depth.r
    }

    const mapSize = (reference('mapSize', 'vec2', shadow) as any).setGroup(renderGroup)
    const texelSize = vec2(1).div(mapSize)

    // Use IGN to rotate sampling pattern per pixel (phi = IGN * 2π)
    const phi = interleavedGradientNoise(screenCoordinate.xy).mul(6.28318530718)

    const uv = shadowCoord.xy
    // shadowCoord.z is in [-1,1] for WebGPU, convert back to [0,1] to match depth texture
    // Reverse of: z * 2 - 1, so: (z + 1) / 2
    const zReceiver = shadowCoord.z.add(1).mul(0.5)

    // ============================================
    // STEP 1: Find average blocker depth
    // ============================================
    const blockerSearchRadius = texelSize.x.mul(size).mul(2)

    const blockerDepthSum = float(focus).toVar('blockerDepthSum')
    const blockerCount = float(0).toVar('blockerCount')

    for (let i = 0; i < sampleCount; i++) {
      const offset = vogelDiskSample(int(i), int(sampleCount), phi).mul(blockerSearchRadius)
      const sampleUV = uv.add(offset)
      const sampleDepthVal = sampleDepth(sampleUV)

      // isBlocker = 1 if sampleDepth < zReceiver (blocker is closer than receiver)
      const isBlocker = step(sampleDepthVal, zReceiver).sub(step(zReceiver, sampleDepthVal)).max(0)
      blockerDepthSum.addAssign(sampleDepthVal.mul(isBlocker))
      blockerCount.addAssign(isBlocker)
    }

    const avgBlockerDepth = blockerDepthSum.div(blockerCount.max(1))

    // ============================================
    // STEP 2: Estimate penumbra size
    // ============================================
    const penumbraRatio = zReceiver.sub(avgBlockerDepth).div(avgBlockerDepth.max(0.0001))
    // 1.25 multiplier matches legacy PCSS for consistent softness
    const filterRadius = texelSize.x.mul(float(1).add(penumbraRatio.mul(1.25).mul(size)))

    // ============================================
    // STEP 3: PCF filter with penumbra-based radius (manual comparison)
    // ============================================
    const shadowSum = float(0).toVar('shadowSum')

    for (let i = 0; i < sampleCount; i++) {
      const offset = vogelDiskSample(int(i), int(sampleCount), phi).mul(filterRadius)
      const sampleUV = uv.add(offset)
      const sampleDepthVal = sampleDepth(sampleUV)
      // In shadow if depth < receiver (occluder is closer), so lit = step(zReceiver, depth)
      shadowSum.addAssign(step(zReceiver, sampleDepthVal))
    }

    const shadowResult = shadowSum.div(sampleCount)

    // If no blockers found, return fully lit; otherwise return shadow
    const hasBlockers = blockerCount.greaterThan(0.5)
    return hasBlockers.select(shadowResult, float(1))
  })
}

/**
 * A custom shadow node that implements PCSS (Percentage Closer Soft Shadows).
 *
 * PCSS creates realistic soft shadows where the shadow edge softness varies
 * based on the distance between the occluder and the receiver surface.
 *
 * @example
 * ```tsx
 * import { PCSSShadowNode } from '@react-three/drei/webgpu'
 *
 * const light = new DirectionalLight()
 * light.castShadow = true
 * light.shadow.shadowNode = new PCSSShadowNode(light, { size: 25, samples: 10 })
 * ```
 */
export class PCSSShadowNode extends ShadowNode {
  size: number
  samples: number
  focus: number

  constructor(light: Light, { size = 25, samples = 10, focus = 0 }: PCSSShadowNodeOptions = {}) {
    super(light, (light as any).shadow)
    this.size = size
    this.samples = samples
    this.focus = focus
  }

  /**
   * Override to disable hardware depth comparison.
   * PCSS needs raw depth values for blocker search, so we can't use comparison samplers.
   */
  setupRenderTarget(shadow: any, builder: any) {
    // Call parent method (not in TS types but exists at runtime)
    const parentMethod = Object.getPrototypeOf(Object.getPrototypeOf(this)).setupRenderTarget
    const result = parentMethod.call(this, shadow, builder)

    // Disable comparison function so we can sample raw depth values
    // This is similar to how VSM shadows work in Three.js
    if (result.depthTexture) {
      result.depthTexture.compareFunction = null
    }

    return result
  }

  /**
   * Override to use our PCSS filter instead of the default filter.
   */
  getShadowFilterFn(_type: number) {
    return createPCSSFilter(this.size, this.samples, this.focus)
  }
}

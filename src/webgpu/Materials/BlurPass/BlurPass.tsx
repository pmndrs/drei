//* BlurPass - TSL WebGPU Implementation ==============================
// Multi-pass Kawase blur driven by the TSL ConvolutionMaterial next door.
// Ping-pongs between two RenderTargets, widening the kernel each pass.
//
// WebGPU notes:
// - `RenderTarget` replaces `WebGLRenderTarget`; `three/webgpu` does not export
//   `WebGLRenderer` at all, so the renderer is typed as the common `Renderer` base
//   (which `WebGPURenderer` extends).
// - The fullscreen triangle is a `QuadMesh`, three's own post-processing helper.
//   `quad.render(renderer)` is the WebGPU equivalent of `renderer.render(scene, camera)`
//   and is synchronous once the renderer has been initialised (r3f does that before
//   the first frame, so calling this from `useFrame` is safe).
//
// TSL conversion tracked in #2811.

import * as THREE from 'three/webgpu'
import { QuadMesh } from 'three/webgpu'
import { ConvolutionMaterial } from '../ConvolutionMaterial'

export interface BlurPassProps {
  /** Renderer. Unused by the constructor, kept for parity with the legacy pass. */
  gl?: THREE.Renderer
  /** Size of the two intermediate ping-pong render targets */
  resolution: number
  /** Width used to derive the texel size, default: 500 */
  width?: number
  /** Height used to derive the texel size, default: 500 */
  height?: number
  /** Depth below which no blur is applied, default: 0 */
  minDepthThreshold?: number
  /** Depth above which full blur is applied, default: 1 */
  maxDepthThreshold?: number
  /** Strength of the depth-based blur falloff. 0 disables depth entirely, default: 0 */
  depthScale?: number
  /** Bias added to the depth-to-blur ratio, default: 0.25 */
  depthToBlurRatioBias?: number
}

/**
 * Multi-pass blur for WebGPU.
 *
 * @example
 * ```ts
 * const blur = new BlurPass({ resolution: 256, width: 512, height: 512 })
 * // inside useFrame:
 * blur.render(renderer, fboA, fboB)
 * renderer.setRenderTarget(null)
 * ```
 */
export class BlurPass {
  readonly renderTargetA: THREE.RenderTarget
  readonly renderTargetB: THREE.RenderTarget
  readonly convolutionMaterial: ConvolutionMaterial
  /** Fullscreen triangle the convolution material is drawn with */
  readonly screen: QuadMesh
  renderToScreen: boolean = false

  constructor({
    resolution,
    width = 500,
    height = 500,
    minDepthThreshold = 0,
    maxDepthThreshold = 1,
    depthScale = 0,
    depthToBlurRatioBias = 0.25,
  }: BlurPassProps) {
    this.renderTargetA = new THREE.RenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
      type: THREE.HalfFloatType,
    })
    this.renderTargetB = this.renderTargetA.clone()

    const material = new ConvolutionMaterial()
    material.setTexelSize(1.0 / width, 1.0 / height)
    material.setResolution(new THREE.Vector2(width, height))
    material.minDepthThreshold = minDepthThreshold
    material.maxDepthThreshold = maxDepthThreshold
    material.depthScale = depthScale
    material.depthToBlurRatioBias = depthToBlurRatioBias
    // The GLSL version toggled a `USE_DEPTH` define; TSL branches on a uniform instead.
    material.useDepth = depthScale > 0
    this.convolutionMaterial = material

    this.screen = new QuadMesh(material)
    this.screen.frustumCulled = false
  }

  /**
   * Runs the blur.
   *
   * Reads `inputBuffer`, ping-pongs through the internal targets, and writes the
   * final pass into `outputBuffer` (or the canvas when `renderToScreen` is true).
   * The render target is left bound, matching the legacy pass — restore it with
   * `renderer.setRenderTarget(null)` when you are done.
   */
  render(renderer: THREE.Renderer, inputBuffer: THREE.RenderTarget, outputBuffer: THREE.RenderTarget | null = null) {
    const material = this.convolutionMaterial
    // Targets created without a depth buffer report `null` here; the material
    // setter substitutes an empty texture in that case.
    material.depthBuffer = inputBuffer.depthTexture
    const kernel = material.kernel

    let lastRT: THREE.RenderTarget = inputBuffer
    let i = 0
    const last = kernel.length - 1

    // Apply the multi-pass blur, alternating between targets.
    for (; i < last; ++i) {
      const destRT = (i & 1) === 0 ? this.renderTargetA : this.renderTargetB
      material.kernelValue = kernel[i]
      material.inputBuffer = lastRT.texture
      renderer.setRenderTarget(destRT)
      this.screen.render(renderer)
      lastRT = destRT
    }

    material.kernelValue = kernel[i]
    material.inputBuffer = lastRT.texture
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer)
    this.screen.render(renderer)
  }

  /** Resize the intermediate targets and recompute the texel size */
  setSize(width: number, height: number) {
    this.renderTargetA.setSize(width, height)
    this.renderTargetB.setSize(width, height)
    this.convolutionMaterial.setTexelSize(1.0 / width, 1.0 / height)
    this.convolutionMaterial.setResolution(new THREE.Vector2(width, height))
  }

  dispose() {
    this.renderTargetA.dispose()
    this.renderTargetB.dispose()
    this.convolutionMaterial.dispose()
  }
}

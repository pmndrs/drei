//* ConvolutionMaterial - TSL WebGPU Implementation ==============================
// Post-processing convolution blur with optional depth-based blur adjustment
// Used for depth-of-field and blur effects
// converted to TSL by Dennis Smolek

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, uniform, uniformTexture, vec2, float, uv, mix, smoothstep, max, min, varying, select } from 'three/tsl'
import { withUniforms } from '@utils/withUniforms'

//* ConvolutionMaterial ==============================
// Samples 4 offset positions around each pixel and averages them for blur.
// Optionally adjusts blur based on depth buffer for depth-of-field effects.

export class ConvolutionMaterial extends withUniforms(MeshBasicNodeMaterial, {
  /** Input color buffer to blur */
  inputBuffer: () => uniformTexture(new THREE.Texture()),
  /** Depth buffer for depth-aware blur */
  depthBuffer: () => uniformTexture(new THREE.Texture()),
  /** Render resolution */
  resolution: () => uniform(new THREE.Vector2()),
  /** Texel size (1/resolution) */
  texelSize: () => uniform(new THREE.Vector2()),
  /** Half texel size for offset calculations */
  halfTexelSize: () => uniform(new THREE.Vector2()),
  /** Kernel offset multiplier (changes per blur pass) */
  kernelValue: () => uniform(0.0),
  /** Scale factor for blur spread */
  scale: () => uniform(1.0),
  /** Camera near plane for depth calculations */
  cameraNear: () => uniform(0.0),
  /** Camera far plane for depth calculations */
  cameraFar: () => uniform(1.0),
  /** Minimum depth threshold for blur (objects closer than this get less blur) */
  minDepthThreshold: () => uniform(0.0),
  /** Maximum depth threshold for blur (objects farther than this get full blur) */
  maxDepthThreshold: () => uniform(1.0),
  /** Scale factor for depth-based blur adjustment */
  depthScale: () => uniform(0.0),
  /** Bias added to depth-to-blur ratio */
  depthToBlurRatioBias: () => uniform(0.25),
  /** Enable depth-based blur */
  useDepth: () => uniform(false),
}) {
  /** Kernel weights for multi-pass blur */
  readonly kernel: Float32Array

  constructor(texelSize = new THREE.Vector2()) {
    super()

    //* Material Properties --
    this.blending = THREE.NoBlending
    this.depthWrite = false
    this.depthTest = false
    this.toneMapped = false

    // Kernel weights for Kawase blur passes
    this.kernel = new Float32Array([0.0, 1.0, 2.0, 2.0, 3.0])

    // Initialize texel size
    this.setTexelSize(texelSize.x, texelSize.y)

    this._buildShader()
  }

  private _buildShader() {
    //* Capture uniforms for closure --
    const {
      inputBuffer: inputBufferTex,
      depthBuffer: depthBufferTex,
      texelSize: texelSizeUniform,
      halfTexelSize: halfTexelSizeUniform,
      kernelValue: kernelUniform,
      scale: scaleUniform,
      minDepthThreshold: minDepthThresholdUniform,
      maxDepthThreshold: maxDepthThresholdUniform,
      depthScale: depthScaleUniform,
      depthToBlurRatioBias: depthToBlurRatioBiasUniform,
      useDepth: useDepthUniform,
    } = this.uniforms

    //* Vertex: Compute offset UVs as varyings --
    // For fullscreen quad, UV is derived from position

    // Base UV coordinate
    const baseUv = varying<'vec2'>(uv(), 'vUv')

    // Calculate texel offset based on kernel and scale
    // dUv = (texelSize * kernel + halfTexelSize) * scale
    const dUv = varying<'vec2'>(
      Fn(() => {
        return texelSizeUniform.mul(kernelUniform).add(halfTexelSizeUniform).mul(scaleUniform)
      })(),
      'vDuv'
    )

    // Offset UVs for 4-tap sampling (corners of a diamond pattern)
    const vUv0 = varying<'vec2'>(Fn(() => vec2(baseUv.x.sub(dUv.x), baseUv.y.add(dUv.y)))(), 'vUv0')
    const vUv1 = varying<'vec2'>(Fn(() => vec2(baseUv.x.add(dUv.x), baseUv.y.add(dUv.y)))(), 'vUv1')
    const vUv2 = varying<'vec2'>(Fn(() => vec2(baseUv.x.add(dUv.x), baseUv.y.sub(dUv.y)))(), 'vUv2')
    const vUv3 = varying<'vec2'>(Fn(() => vec2(baseUv.x.sub(dUv.x), baseUv.y.sub(dUv.y)))(), 'vUv3')

    //* Fragment: Sample and blend --
    this.colorNode = Fn(() => {
      // Calculate depth-based blur factor if depth is enabled
      const depthFactor = float(0.0).toVar()

      // Depth-based blur adjustment
      // depthFactor = smoothstep(min, max, 1 - (depth.r * depth.a)) * depthScale
      const depthSample = depthBufferTex.sample(baseUv)
      const rawDepth = float(1.0).sub(depthSample.r.mul(depthSample.a))
      const smoothedDepth = smoothstep(minDepthThresholdUniform, maxDepthThresholdUniform, rawDepth)
      const scaledDepth = smoothedDepth.mul(depthScaleUniform)
      // Clamp and add bias: max(0, min(1, scaledDepth + depthToBlurRatioBias))
      // (the bias defaults to 0.25, which is what the GLSL version hard-coded)
      const clampedDepth = max(float(0.0), min(float(1.0), scaledDepth.add(depthToBlurRatioBiasUniform)))

      depthFactor.assign(select(useDepthUniform, clampedDepth, float(0.0)))

      //* Sample 4 corners with depth-adjusted UV interpolation --
      // When depthFactor = 0, sample at offset UV
      // When depthFactor = 1, sample at center UV (less blur for near objects)
      const sample0 = inputBufferTex.sample(mix(vUv0, baseUv, depthFactor))
      const sample1 = inputBufferTex.sample(mix(vUv1, baseUv, depthFactor))
      const sample2 = inputBufferTex.sample(mix(vUv2, baseUv, depthFactor))
      const sample3 = inputBufferTex.sample(mix(vUv3, baseUv, depthFactor))

      // Average the 4 samples
      const sum = sample0.add(sample1).add(sample2).add(sample3)
      return sum.mul(0.25)
    })()
  }

  //* Utility Methods ==============================

  /** Set texel size for blur calculations */
  setTexelSize(x: number, y: number) {
    this.uniforms.texelSize.value.set(x, y)
    this.uniforms.halfTexelSize.value.set(x * 0.5, y * 0.5)
  }

  /** Set render resolution */
  setResolution(resolution: THREE.Vector2) {
    this.uniforms.resolution.value.copy(resolution)
  }
}

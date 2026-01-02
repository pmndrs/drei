//* ConvolutionMaterial - TSL WebGPU Implementation ==============================
// Post-processing convolution blur with optional depth-based blur adjustment
// Used for depth-of-field and blur effects
// converted to TSL by Dennis Smolek

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec2,
  vec4,
  float,
  texture,
  uv,
  positionLocal,
  mix,
  smoothstep,
  max,
  min,
  varying,
  select,
} from 'three/tsl'

//* ConvolutionMaterial ==============================
// Samples 4 offset positions around each pixel and averages them for blur.
// Optionally adjusts blur based on depth buffer for depth-of-field effects.

export class ConvolutionMaterial extends MeshBasicNodeMaterial {
  //* Private Uniform Nodes --
  private _inputBuffer: THREE.TextureNode
  private _depthBuffer: THREE.TextureNode
  private _resolution: THREE.UniformNode<THREE.Vector2>
  private _texelSize: THREE.UniformNode<THREE.Vector2>
  private _halfTexelSize: THREE.UniformNode<THREE.Vector2>
  private _kernel: THREE.UniformNode<number>
  private _scale: THREE.UniformNode<number>
  private _cameraNear: THREE.UniformNode<number>
  private _cameraFar: THREE.UniformNode<number>
  private _minDepthThreshold: THREE.UniformNode<number>
  private _maxDepthThreshold: THREE.UniformNode<number>
  private _depthScale: THREE.UniformNode<number>
  private _depthToBlurRatioBias: THREE.UniformNode<number>
  private _useDepth: THREE.UniformNode<number>

  /** Kernel weights for multi-pass blur */
  readonly kernel: Float32Array

  constructor(texelSize = new THREE.Vector2()) {
    super()

    //* Initialize Uniforms --
    this._inputBuffer = uniformTexture(new THREE.Texture())
    this._depthBuffer = uniformTexture(new THREE.Texture())
    this._resolution = uniform(new THREE.Vector2())
    this._texelSize = uniform(new THREE.Vector2())
    this._halfTexelSize = uniform(new THREE.Vector2())
    this._kernel = uniform(0.0)
    this._scale = uniform(1.0)
    this._cameraNear = uniform(0.0)
    this._cameraFar = uniform(1.0)
    this._minDepthThreshold = uniform(0.0)
    this._maxDepthThreshold = uniform(1.0)
    this._depthScale = uniform(0.0)
    this._depthToBlurRatioBias = uniform(0.25)
    this._useDepth = uniform(0.0) // 0 = no depth, 1 = use depth

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
    const inputBufferTex = this._inputBuffer
    const depthBufferTex = this._depthBuffer
    const texelSizeUniform = this._texelSize
    const halfTexelSizeUniform = this._halfTexelSize
    const kernelUniform = this._kernel
    const scaleUniform = this._scale
    const minDepthThresholdUniform = this._minDepthThreshold
    const maxDepthThresholdUniform = this._maxDepthThreshold
    const depthScaleUniform = this._depthScale
    const useDepthUniform = this._useDepth

    //* Vertex: Compute offset UVs as varyings --
    // For fullscreen quad, UV is derived from position

    // Base UV coordinate
    const baseUv = varying(uv(), 'vUv')

    // Calculate texel offset based on kernel and scale
    // dUv = (texelSize * kernel + halfTexelSize) * scale
    const dUv = varying(
      Fn(() => {
        return texelSizeUniform.mul(kernelUniform).add(halfTexelSizeUniform).mul(scaleUniform)
      })(),
      'vDuv'
    )

    // Offset UVs for 4-tap sampling (corners of a diamond pattern)
    const vUv0 = varying(Fn(() => vec2(baseUv.x.sub(dUv.x), baseUv.y.add(dUv.y)))(), 'vUv0')
    const vUv1 = varying(Fn(() => vec2(baseUv.x.add(dUv.x), baseUv.y.add(dUv.y)))(), 'vUv1')
    const vUv2 = varying(Fn(() => vec2(baseUv.x.add(dUv.x), baseUv.y.sub(dUv.y)))(), 'vUv2')
    const vUv3 = varying(Fn(() => vec2(baseUv.x.sub(dUv.x), baseUv.y.sub(dUv.y)))(), 'vUv3')

    //* Fragment: Sample and blend --
    this.colorNode = Fn(() => {
      // Calculate depth-based blur factor if depth is enabled
      const depthFactor = float(0.0).toVar()

      // Depth-based blur adjustment
      // depthFactor = smoothstep(min, max, 1 - (depth.r * depth.a)) * depthScale
      const isUsingDepth = useDepthUniform.greaterThan(0.5)
      const depthSample = texture(depthBufferTex, baseUv)
      const rawDepth = float(1.0).sub(depthSample.r.mul(depthSample.a))
      const smoothedDepth = smoothstep(minDepthThresholdUniform, maxDepthThresholdUniform, rawDepth)
      const scaledDepth = smoothedDepth.mul(depthScaleUniform)
      // Clamp and add bias: max(0, min(1, scaledDepth + 0.25))
      const clampedDepth = max(float(0.0), min(float(1.0), scaledDepth.add(0.25)))

      depthFactor.assign(select(isUsingDepth, clampedDepth, float(0.0)))

      //* Sample 4 corners with depth-adjusted UV interpolation --
      // When depthFactor = 0, sample at offset UV
      // When depthFactor = 1, sample at center UV (less blur for near objects)
      const sample0 = texture(inputBufferTex, mix(vUv0, baseUv, depthFactor))
      const sample1 = texture(inputBufferTex, mix(vUv1, baseUv, depthFactor))
      const sample2 = texture(inputBufferTex, mix(vUv2, baseUv, depthFactor))
      const sample3 = texture(inputBufferTex, mix(vUv3, baseUv, depthFactor))

      // Average the 4 samples
      const sum = sample0.add(sample1).add(sample2).add(sample3)
      return sum.mul(0.25)
    })()
  }

  //* Utility Methods ==============================

  /** Set texel size for blur calculations */
  setTexelSize(x: number, y: number) {
    this._texelSize.value.set(x, y)
    this._halfTexelSize.value.set(x * 0.5, y * 0.5)
  }

  /** Set render resolution */
  setResolution(resolution: THREE.Vector2) {
    this._resolution.value.copy(resolution)
  }

  //* Uniform Accessors ==============================

  /** Input color buffer to blur */
  get inputBuffer() {
    return this._inputBuffer.value as THREE.Texture
  }
  set inputBuffer(v: THREE.Texture | null) {
    this._inputBuffer.value = v ?? new THREE.Texture()
  }

  /** Depth buffer for depth-aware blur */
  get depthBuffer() {
    return this._depthBuffer.value as THREE.Texture
  }
  set depthBuffer(v: THREE.Texture | null) {
    this._depthBuffer.value = v ?? new THREE.Texture()
  }

  /** Render resolution */
  get resolution() {
    return this._resolution.value as THREE.Vector2
  }
  set resolution(v: THREE.Vector2) {
    this._resolution.value = v
  }

  /** Texel size (1/resolution) */
  get texelSize() {
    return this._texelSize.value as THREE.Vector2
  }
  set texelSize(v: THREE.Vector2) {
    this._texelSize.value = v
  }

  /** Half texel size for offset calculations */
  get halfTexelSize() {
    return this._halfTexelSize.value as THREE.Vector2
  }
  set halfTexelSize(v: THREE.Vector2) {
    this._halfTexelSize.value = v
  }

  /** Kernel offset multiplier (changes per blur pass) */
  get kernelValue() {
    return this._kernel.value as number
  }
  set kernelValue(v: number) {
    this._kernel.value = v
  }

  /** Scale factor for blur spread */
  get scale() {
    return this._scale.value as number
  }
  set scale(v: number) {
    this._scale.value = v
  }

  /** Camera near plane for depth calculations */
  get cameraNear() {
    return this._cameraNear.value as number
  }
  set cameraNear(v: number) {
    this._cameraNear.value = v
  }

  /** Camera far plane for depth calculations */
  get cameraFar() {
    return this._cameraFar.value as number
  }
  set cameraFar(v: number) {
    this._cameraFar.value = v
  }

  /** Minimum depth threshold for blur (objects closer than this get less blur) */
  get minDepthThreshold() {
    return this._minDepthThreshold.value as number
  }
  set minDepthThreshold(v: number) {
    this._minDepthThreshold.value = v
  }

  /** Maximum depth threshold for blur (objects farther than this get full blur) */
  get maxDepthThreshold() {
    return this._maxDepthThreshold.value as number
  }
  set maxDepthThreshold(v: number) {
    this._maxDepthThreshold.value = v
  }

  /** Scale factor for depth-based blur adjustment */
  get depthScale() {
    return this._depthScale.value as number
  }
  set depthScale(v: number) {
    this._depthScale.value = v
  }

  /** Bias added to depth-to-blur ratio */
  get depthToBlurRatioBias() {
    return this._depthToBlurRatioBias.value as number
  }
  set depthToBlurRatioBias(v: number) {
    this._depthToBlurRatioBias.value = v
  }

  /** Enable/disable depth-based blur (0 = off, 1 = on) */
  get useDepth() {
    return this._useDepth.value > 0.5
  }
  set useDepth(v: boolean) {
    this._useDepth.value = v ? 1.0 : 0.0
  }
}

import * as THREE from 'three/webgpu'
import { Fn, uniform, vec4, vec3, float, mix, clamp, reflector } from 'three/tsl'
import { hashBlur } from 'three/examples/jsm/tsl/display/hashBlur.js'

//* MeshReflectorMaterial TSL Implementation ==============================

export interface MeshReflectorMaterialOptions {
  resolution?: number
  mixBlur?: number
  mixStrength?: number
  mirror?: number
  minDepthThreshold?: number
  maxDepthThreshold?: number
  depthScale?: number
  depthToBlurRatioBias?: number
  distortion?: number
  mixContrast?: number
  reflectorOffset?: number
}

/**
 * WebGPU TSL-based reflector material extending MeshStandardNodeMaterial.
 * Uses the built-in reflector() TSL node for proper planar reflections.
 */
export class MeshReflectorMaterial extends THREE.MeshStandardNodeMaterial {
  //* Reflector Node ----------------------------------------
  reflection: ReturnType<typeof reflector>

  //* Uniforms ----------------------------------------
  mirrorUniform: ReturnType<typeof uniform<number>>
  mixBlurUniform: ReturnType<typeof uniform<number>>
  mixStrengthUniform: ReturnType<typeof uniform<number>>
  minDepthThresholdUniform: ReturnType<typeof uniform<number>>
  maxDepthThresholdUniform: ReturnType<typeof uniform<number>>
  depthScaleUniform: ReturnType<typeof uniform<number>>
  depthToBlurRatioBiasUniform: ReturnType<typeof uniform<number>>
  distortionUniform: ReturnType<typeof uniform<number>>
  mixContrastUniform: ReturnType<typeof uniform<number>>
  blurRadiusUniform: ReturnType<typeof uniform<number>>

  // Feature flags
  hasBlurUniform: ReturnType<typeof uniform<number>>
  hasDepthUniform: ReturnType<typeof uniform<number>>

  constructor(options: MeshReflectorMaterialOptions = {}, parameters: THREE.MeshStandardMaterialParameters = {}) {
    super()
    // Only set valid MeshStandardMaterial properties (filter out custom ones like distortionMap)
    const { distortionMap, ...validParams } = parameters as any
    if (Object.keys(validParams).length > 0) {
      this.setValues(validParams)
    }

    const {
      resolution = 256,
      mixBlur = 0,
      mixStrength = 1,
      mirror = 0,
      minDepthThreshold = 0.9,
      maxDepthThreshold = 1,
      depthScale = 0,
      depthToBlurRatioBias = 0.25,
      distortion = 1,
      mixContrast = 1,
    } = options

    // Convert pixel resolution to scale (relative to screen size)
    // resolutionScale of 0.5 = half the render size
    const resolutionScale = Math.min(1, resolution / 1024)

    //* Create Reflector Node ----------------------------------------
    // The reflector() function handles all the reflection rendering automatically
    this.reflection = reflector({
      resolutionScale: resolutionScale,
      generateMipmaps: true,
    })

    //* Initialize Uniforms ----------------------------------------
    this.mirrorUniform = uniform(mirror)
    this.mixBlurUniform = uniform(mixBlur)
    this.mixStrengthUniform = uniform(mixStrength)
    this.minDepthThresholdUniform = uniform(minDepthThreshold)
    this.maxDepthThresholdUniform = uniform(maxDepthThreshold)
    this.depthScaleUniform = uniform(depthScale)
    this.depthToBlurRatioBiasUniform = uniform(depthToBlurRatioBias)
    this.distortionUniform = uniform(distortion)
    this.mixContrastUniform = uniform(mixContrast)

    // Blur radius (0-1 range, will be scaled)
    this.blurRadiusUniform = uniform(0.1)

    // Feature flags
    this.hasBlurUniform = uniform(mixBlur > 0 ? 1 : 0)
    this.hasDepthUniform = uniform(depthScale > 0 ? 1 : 0)

    //* Setup TSL Nodes ----------------------------------------
    this.setupNodes()
  }

  private setupNodes() {
    //* Color Node - Reflection Blending ----------------------------------------
    this.colorNode = Fn(() => {
      // Sample the reflection directly
      const reflectionSample = this.reflection.sample(this.reflection.uvNode!)

      // Apply blur using hashBlur
      const blurRadius = mix(float(0.01), float(0.15), this.blurRadiusUniform)
      const reflectionBlurred = hashBlur(this.reflection, blurRadius, {
        repeats: float(20),
        premultipliedAlpha: false,
      } as any)

      // Choose between blurred and unblurred based on hasBlur flag
      const reflectionColor = mix(reflectionSample.rgb, reflectionBlurred.rgb, clamp(this.hasBlurUniform, 0.0, 1.0))

      // Clamp HDR values to [0,1] range before contrast adjustment
      const reflectionClamped = clamp(reflectionColor, 0.0, 1.0)

      // Apply contrast adjustment on clamped values
      const contrastAdjusted = vec3(
        reflectionClamped.x.sub(0.5).mul(this.mixContrastUniform).add(0.5),
        reflectionClamped.y.sub(0.5).mul(this.mixContrastUniform).add(0.5),
        reflectionClamped.z.sub(0.5).mul(this.mixContrastUniform).add(0.5)
      )

      // Final blend with mirror and mix strength
      const mirrorClamped = clamp(this.mirrorUniform, 0.0, 1.0)

      // Output: blend reflection with base color
      // (1 - mirror) gives base material influence, + reflection * mixStrength adds reflection
      return vec4(vec3(1.0).sub(vec3(mirrorClamped)).add(contrastAdjusted.mul(this.mixStrengthUniform)), 1.0)
    })()
  }

  //* Getters and Setters ----------------------------------------

  get mirror(): number {
    return this.mirrorUniform.value
  }
  set mirror(v: number) {
    this.mirrorUniform.value = v
  }

  get mixBlur(): number {
    return this.mixBlurUniform.value
  }
  set mixBlur(v: number) {
    this.mixBlurUniform.value = v
    this.hasBlurUniform.value = v > 0 ? 1 : 0
  }

  get mixStrength(): number {
    return this.mixStrengthUniform.value
  }
  set mixStrength(v: number) {
    this.mixStrengthUniform.value = v
  }

  get minDepthThreshold(): number {
    return this.minDepthThresholdUniform.value
  }
  set minDepthThreshold(v: number) {
    this.minDepthThresholdUniform.value = v
  }

  get maxDepthThreshold(): number {
    return this.maxDepthThresholdUniform.value
  }
  set maxDepthThreshold(v: number) {
    this.maxDepthThresholdUniform.value = v
  }

  get depthScale(): number {
    return this.depthScaleUniform.value
  }
  set depthScale(v: number) {
    this.depthScaleUniform.value = v
    this.hasDepthUniform.value = v > 0 ? 1 : 0
  }

  get depthToBlurRatioBias(): number {
    return this.depthToBlurRatioBiasUniform.value
  }
  set depthToBlurRatioBias(v: number) {
    this.depthToBlurRatioBiasUniform.value = v
  }

  get distortion(): number {
    return this.distortionUniform.value
  }
  set distortion(v: number) {
    this.distortionUniform.value = v
  }

  get mixContrast(): number {
    return this.mixContrastUniform.value
  }
  set mixContrast(v: number) {
    this.mixContrastUniform.value = v
  }

  get blurRadius(): number {
    return this.blurRadiusUniform.value
  }
  set blurRadius(v: number) {
    this.blurRadiusUniform.value = v
  }

  /**
   * Get the reflector target mesh that needs to be added to the scene.
   * The target should be positioned and rotated to match the reflective surface.
   */
  get reflectorTarget(): THREE.Object3D {
    return this.reflection.target
  }
}

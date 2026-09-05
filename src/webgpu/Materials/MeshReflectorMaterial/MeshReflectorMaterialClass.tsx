import * as THREE from 'three/webgpu'
import { Fn, uniform, vec4, vec3, float, mix, clamp, select, reflector } from 'three/tsl'
import { hashBlur } from 'three/examples/jsm/tsl/display/hashBlur.js'
import { withUniforms } from '@utils/withUniforms'

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

/** Planar reflections with optional blur, distortion, and contrast. */
export class MeshReflectorMaterial extends withUniforms(THREE.MeshStandardNodeMaterial, {
  /** Mirror strength, 0 = base material only, 1 = pure reflection */
  mirror: () => uniform(0),
  /** Positive values enable the blurred reflection sample */
  mixBlur: () => uniform(0),
  /** Strength of the reflection added on top of the base colour */
  mixStrength: () => uniform(1),
  /** Lower depth threshold for depth-based blur */
  minDepthThreshold: () => uniform(0.9),
  /** Upper depth threshold for depth-based blur */
  maxDepthThreshold: () => uniform(1),
  /** Depth scale for depth-based blur, 0 = disabled */
  depthScale: () => uniform(0),
  /** Bias added to the depth-to-blur ratio */
  depthToBlurRatioBias: () => uniform(0.25),
  /** Distortion strength */
  distortion: () => uniform(1),
  /** Contrast applied to the (clamped) reflection colour */
  mixContrast: () => uniform(1),
  /** Blur radius in the 0-1 range, scaled to 0.01-0.15 in the shader */
  blurRadius: () => uniform(0.1),
}) {
  //* Reflector Node ----------------------------------------
  reflection: ReturnType<typeof reflector>

  /**
   * Add this target to the scene and align it with the reflective surface.
   */
  get reflectorTarget(): THREE.Object3D {
    return this.reflection?.target
  }

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
    this.mirror = mirror
    this.mixBlur = mixBlur
    this.mixStrength = mixStrength
    this.minDepthThreshold = minDepthThreshold
    this.maxDepthThreshold = maxDepthThreshold
    this.depthScale = depthScale
    this.depthToBlurRatioBias = depthToBlurRatioBias
    this.distortion = distortion
    this.mixContrast = mixContrast

    //* Setup TSL Nodes ----------------------------------------
    this.setupNodes()
  }

  private setupNodes() {
    const { mirror, mixBlur, mixStrength, mixContrast, blurRadius } = this.uniforms

    //* Color Node - Reflection Blending ----------------------------------------
    this.colorNode = Fn(() => {
      // Sample the reflection directly
      const reflectionSample = this.reflection.sample(this.reflection.uvNode!)

      // Apply blur using hashBlur
      const radius = mix(float(0.01), float(0.15), blurRadius)
      const reflectionBlurred = hashBlur(this.reflection, radius, {
        repeats: float(20),
        premultipliedAlpha: false,
      } as any)

      // Choose between blurred and unblurred: any mixBlur > 0 enables the blur
      const reflectionColor = select(mixBlur.greaterThan(0), reflectionBlurred.rgb, reflectionSample.rgb)

      // Clamp HDR values to [0,1] range before contrast adjustment
      const reflectionClamped = clamp(reflectionColor, 0.0, 1.0)

      // Apply contrast adjustment on clamped values
      const contrastAdjusted = vec3(
        reflectionClamped.x.sub(0.5).mul(mixContrast).add(0.5),
        reflectionClamped.y.sub(0.5).mul(mixContrast).add(0.5),
        reflectionClamped.z.sub(0.5).mul(mixContrast).add(0.5)
      )

      // Final blend with mirror and mix strength
      const mirrorClamped = clamp(mirror, 0.0, 1.0)

      // Output: blend reflection with base color
      // (1 - mirror) gives base material influence, + reflection * mixStrength adds reflection
      return vec4(vec3(1.0).sub(vec3(mirrorClamped)).add(contrastAdjusted.mul(mixStrength)), 1.0)
    })()
  }
}

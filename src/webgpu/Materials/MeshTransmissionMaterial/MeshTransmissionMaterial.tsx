/** MeshTransmissionMaterial - TSL WebGPU Implementation
 * Author: @N8Programs https://github.com/N8python
 * https://gist.github.com/N8python/eb42d25c7cd00d12e965ac9cba544317
 *
 * Inspired by: @ore_ukonpower and http://next.junni.co.jp
 * https://github.com/junni-inc/next.junni.co.jp/blob/master/src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/shaders/transparent.fs
 *
 * TSL Conversion: Dennis Smolek - drei webgpu migration
 *
 * This material extends MeshPhysicalNodeMaterial with a custom LightingModel
 * that overrides transmission sampling to use our FBO-based approach with
 * chromatic aberration and noise distortion.
 */

import * as THREE from 'three/webgpu'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  texture,
  vec2,
  vec3,
  vec4,
  float,
  int,
  positionWorld,
  normalWorld,
  normalize,
  dot,
  length,
  refract,
  max,
  pow,
  exp,
  log,
  fract,
  sin,
  select,
  mix,
  cameraPosition,
  cameraViewMatrix,
  cameraProjectionMatrix,
  modelWorldMatrix,
  screenCoordinate,
  Loop,
  diffuseColor,
  // Property nodes for material values
  ior,
  thickness,
  roughness,
  attenuationColor,
  attenuationDistance,
  transmission,
  specularF90,
  uniformTexture,
} from 'three/tsl'

// These property nodes are used internally by PhysicalLightingModel but not exported from three/tsl types
// @ts-ignore - Property nodes exist at runtime but not in TS types
import { diffuseContribution, specularColorBlended } from 'three/src/nodes/core/PropertyNode.js'

// Import the base lighting model and BSDF functions
import PhysicalLightingModel from 'three/src/nodes/functions/PhysicalLightingModel.js'
import { mx_fractal_noise_vec3 } from 'three/tsl'
import F_Schlick from 'three/src/nodes/functions/BSDF/F_Schlick.js'

import * as React from 'react'
import { extend, ThreeElements, useFrame } from '@react-three/fiber'
import { useFBO } from '@core/Portal/Fbo'
import { DiscardMaterial } from '@webgpu/Materials/DiscardMaterial'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

type MeshTransmissionMaterialType = Omit<
  ThreeElements['meshPhysicalMaterial'],
  'args' | 'roughness' | 'thickness' | 'transmission'
> & {
  /* Transmission, default: 1 */
  transmission?: number
  /* Thickness (refraction), default: 0 */
  thickness?: number
  /* Roughness (blur), default: 0 */
  roughness?: number
  /* Chromatic aberration, default: 0.03 */
  chromaticAberration?: number
  /* Anisotropy, default: 0.1 */
  anisotropy?: number
  /* AnisotropicBlur, default: 0.1 */
  anisotropicBlur?: number
  /* Distortion, default: 0 */
  distortion?: number
  /* Distortion scale, default: 0.5 */
  distortionScale?: number
  /* Temporal distortion (speed of movement), default: 0.0 */
  temporalDistortion?: number
  /** The scene rendered into a texture (use it to share a texture between materials), default: null  */
  buffer?: THREE.Texture
  /** Internals */
  time?: number
  /** Internals */
  args?: [samples: number, transmissionSampler: boolean]
}

export type MeshTransmissionMaterialProps = Omit<MeshTransmissionMaterialType, 'ref' | 'args'> & {
  /** transmissionSampler, you can use the threejs transmission sampler texture that is
   *  generated once for all transmissive materials. The upside is that it can be faster if you
   *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
   *  using this can't see other transparent or transmissive objects, default: false */
  transmissionSampler?: boolean
  /** Render the backside of the material (more cost, better results), default: false */
  backside?: boolean
  /** Backside thickness (when backside is true), default: 0 */
  backsideThickness?: number
  backsideEnvMapIntensity?: number
  /** Resolution of the local buffer, default: undefined (fullscreen) */
  resolution?: number
  /** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
  backsideResolution?: number
  /** Refraction samples, default: 6 */
  samples?: number
  /** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
  background?: THREE.Texture | THREE.Color
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshTransmissionMaterial: MeshTransmissionMaterialType
  }
}

//* TSL Helper Functions ==============================

/**
 * Pseudo-random value for sample jittering
 * Uses fragment coordinates and a running seed for stable randomness
 */
const rand = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [seed, fragCoord] = inputs
  return fract(sin(dot(vec3(fragCoord.xy, seed), vec3(12.9898, 78.233, 45.164))).mul(43758.5453))
})

/**
 * Beer's Law volume attenuation
 * Simulates light absorption as it travels through a medium
 */
const applyVolumeAttenuation = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [radiance, transmissionDistance, attColor, attDistance] = inputs
  // If attenuation distance is very large (infinity), no attenuation
  const isInfinite = attDistance.greaterThan(1e10)

  // Compute attenuation using Beer's law
  const safeColor = max(attColor, vec3(0.0001))
  const attenuationCoefficient = log(safeColor).negate().div(attDistance)
  const transmittance = exp(attenuationCoefficient.negate().mul(transmissionDistance))

  return select(isInfinite, radiance, transmittance.mul(radiance))
})

/**
 * Sample the FBO buffer at a refracted position
 * Projects world-space exit point to screen UV coordinates
 * Returns the UV coordinates for sampling (texture sampling done by caller)
 */
const getRefractionUV = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [norm, viewDir, iorVal, thicknessVal, position] = inputs
  // Get refraction direction
  const refractionDir = refract(viewDir.negate(), norm, float(1.0).div(iorVal))

  // Compute model scale for thickness
  const modelScale = vec3(
    length(modelWorldMatrix[0].xyz),
    length(modelWorldMatrix[1].xyz),
    length(modelWorldMatrix[2].xyz)
  )

  // Calculate exit point in world space
  const transmissionRay = normalize(refractionDir).mul(thicknessVal.mul(modelScale))
  const refractedExit = position.add(transmissionRay)

  // Project to clip space
  const clipPos = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(refractedExit, 1.0)))
  const ndcPos = clipPos.xyz.div(clipPos.w)

  // Convert to UV coordinates (0 to 1) and clamp to avoid out-of-bounds sampling
  const refractionUV = vec2(
    ndcPos.x.mul(0.5).add(0.5).clamp(0.001, 0.999),
    ndcPos.y.negate().mul(0.5).add(0.5).clamp(0.001, 0.999)
  )

  return refractionUV
})

//* Custom Transmission Lighting Model ==============================

interface TransmissionLightingModelOptions {
  clearcoat?: boolean
  sheen?: boolean
  iridescence?: boolean
  anisotropy?: boolean
  dispersion?: boolean
}

interface TransmissionUniforms {
  bufferTex: any
  chromaticAberration: any
  anisotropicBlur: any
  timeUniform: any
  distortion: any
  distortionScale: any
  temporalDistortion: any
  samples: number
}

/**
 * Custom LightingModel that extends PhysicalLightingModel
 * Overrides the start() method to use our FBO-based transmission
 * instead of Three.js's built-in viewportMipTexture
 */
class TransmissionLightingModel extends PhysicalLightingModel {
  private _bufferTex: any
  private _chromaticAberration: any
  private _anisotropicBlur: any
  private _timeUniform: any
  private _distortion: any
  private _distortionScale: any
  private _temporalDistortion: any
  private _samples: number

  constructor(options: TransmissionLightingModelOptions, transmissionUniforms: TransmissionUniforms) {
    super(
      options.clearcoat ?? false,
      options.sheen ?? false,
      options.iridescence ?? false,
      options.anisotropy ?? false,
      true, // transmission always true for our material
      options.dispersion ?? false
    )

    // Store uniforms for use in start()
    this._bufferTex = transmissionUniforms.bufferTex
    this._chromaticAberration = transmissionUniforms.chromaticAberration
    this._anisotropicBlur = transmissionUniforms.anisotropicBlur
    this._timeUniform = transmissionUniforms.timeUniform
    this._distortion = transmissionUniforms.distortion
    this._distortionScale = transmissionUniforms.distortionScale
    this._temporalDistortion = transmissionUniforms.temporalDistortion
    this._samples = transmissionUniforms.samples
  }

  start(builder: any) {
    // Handle clearcoat setup (from parent)
    if (this.clearcoat === true) {
      this.clearcoatRadiance = vec3().toVar('clearcoatRadiance')
      this.clearcoatSpecularDirect = vec3().toVar('clearcoatSpecularDirect')
      this.clearcoatSpecularIndirect = vec3().toVar('clearcoatSpecularIndirect')
    }

    // Handle sheen setup (from parent)
    if (this.sheen === true) {
      this.sheenSpecularDirect = vec3().toVar('sheenSpecularDirect')
      this.sheenSpecularIndirect = vec3().toVar('sheenSpecularIndirect')
    }

    // Handle iridescence setup (from parent)
    // TODO: Copy iridescence setup if needed for visual parity

    // CUSTOM TRANSMISSION - replaces Three.js's getIBLVolumeRefraction
    if (this.transmission === true) {
      const position = positionWorld
      const v = normalize(cameraPosition.sub(positionWorld))
      const n = normalWorld
      const context = builder.context

      // Capture uniforms for the Fn closure
      const bufferTex = this._bufferTex
      const chromaticAberrationUniform = this._chromaticAberration
      const anisotropicBlurUniform = this._anisotropicBlur
      const timeUniform = this._timeUniform
      const distortionUniform = this._distortion
      const distortionScaleUniform = this._distortionScale
      const temporalDistortionUniform = this._temporalDistortion
      const sampleCount = this._samples

      // Custom transmission calculation
      const getCustomTransmission = Fn(() => {
        const transmissionAccum = vec3(0).toVar('transmissionAccum')
        const fragCoord = screenCoordinate.xy

        // Seed for pseudo-random sampling
        const runningSeed = float(0).toVar('runningSeed')
        const randomCoords = rand(runningSeed, fragCoord)
        runningSeed.addAssign(1)

        // Noise-based distortion normal
        const temporalOffset = vec3(timeUniform, timeUniform.negate(), timeUniform.negate()).mul(
          temporalDistortionUniform
        )

        const noiseInput = position.mul(distortionScaleUniform).add(temporalOffset)

        // Use MaterialX fractal noise for distortion
        // TODO: Port simplex noise if visual parity with legacy is critical
        const distortionNormal = select(
          distortionUniform.greaterThan(0),
          mx_fractal_noise_vec3(noiseInput, int(4), float(2), float(0.5)).mul(distortionUniform),
          vec3(0)
        )

        // Thickness smear for roughness-based blur
        const thicknessSmear = thickness.mul(max(pow(roughness, 0.33), anisotropicBlurUniform))

        // Multi-sample loop with chromatic aberration
        Loop(int(sampleCount), ({ i }) => {
          const fi = float(i)
          const progress = fi.add(randomCoords).div(float(sampleCount))

          // Random direction for roughness-based blur
          const randX = rand(runningSeed, fragCoord).sub(0.5)
          runningSeed.addAssign(1)
          const randY = rand(runningSeed, fragCoord).sub(0.5)
          runningSeed.addAssign(1)
          const randZ = rand(runningSeed, fragCoord).sub(0.5)
          runningSeed.addAssign(1)
          const randW = rand(runningSeed, fragCoord)
          runningSeed.addAssign(1)

          const randomDir = normalize(vec3(randX, randY, randZ)).mul(pow(randW, 0.33))

          // Perturbed normal for this sample
          const sampleNorm = normalize(n.add(roughness.mul(roughness).mul(2).mul(randomDir)).add(distortionNormal))

          // Thickness varies per sample for blur effect
          const sampleThickness = thickness.add(thicknessSmear.mul(progress))

          // Chromatic aberration: different IOR per channel
          // Red: base IOR, Green: shifted, Blue: 2x shifted
          const iorR = ior
          const iorG = ior.mul(float(1).add(chromaticAberrationUniform.mul(progress)))
          const iorB = ior.mul(float(1).add(chromaticAberrationUniform.mul(2).mul(progress)))

          // Get UV coordinates for each channel (different IOR = different refraction)
          const uvR = getRefractionUV(sampleNorm, v, iorR, sampleThickness, position)
          const uvG = getRefractionUV(sampleNorm, v, iorG, sampleThickness, position)
          const uvB = getRefractionUV(sampleNorm, v, iorB, sampleThickness, position)

          // Sample the buffer texture at each UV - texture() reads from the uniform directly
          const sampleR = texture(bufferTex, uvR)
          const sampleG = texture(bufferTex, uvG)
          const sampleB = texture(bufferTex, uvB)

          // Accumulate RGB channels
          transmissionAccum.x.addAssign(sampleR.r)
          transmissionAccum.y.addAssign(sampleG.g)
          transmissionAccum.z.addAssign(sampleB.b)
        })

        // Average samples
        const avgTransmission = transmissionAccum.div(float(sampleCount))

        // Apply Beer's law attenuation
        const attenuated = applyVolumeAttenuation(avgTransmission, thickness, attenuationColor, attenuationDistance)

        // Apply Fresnel (same as Three.js getIBLVolumeRefraction)
        const NdotV = n.dot(v).clamp(0, 1)
        const F = F_Schlick({ f0: specularColorBlended, f90: specularF90, dotVH: NdotV })

        // Transmission with Fresnel and diffuse contribution
        const transmissionWithFresnel = F.oneMinus().mul(attenuated).mul(diffuseContribution)

        return vec4(transmissionWithFresnel, float(1))
      })

      // Set backdrop for transmission blending
      context.backdrop = getCustomTransmission()
      context.backdropAlpha = transmission

      // Blend alpha based on transmission
      diffuseColor.a.mulAssign(mix(1, context.backdrop.a, transmission))
    }

    // Note: We skip calling super.start() transmission code by handling it ourselves
    // but we need to ensure the parent's non-transmission setup runs
    // The parent LightingModel.start() is empty, so we just need to avoid
    // PhysicalLightingModel's transmission block which we've replaced
  }
}

//* MeshTransmissionMaterial Implementation ==============================

class MeshTransmissionMaterialImpl extends MeshPhysicalNodeMaterial {
  // Custom uniforms
  private _chromaticAberration: THREE.UniformNode<number>
  private _anisotropicBlur: THREE.UniformNode<number>
  private _time: THREE.UniformNode<number>
  private _distortion: THREE.UniformNode<number>
  private _distortionScale: THREE.UniformNode<number>
  private _temporalDistortion: THREE.UniformNode<number>
  private _buffer: any // Texture node
  private _transmissionValue: THREE.UniformNode<number>

  /** Type flag for identification */
  readonly isMeshTransmissionMaterial = true

  private _samples: number
  private _transmissionSampler: boolean

  constructor(samples = 6, transmissionSampler = false) {
    super()

    this._samples = samples
    this._transmissionSampler = transmissionSampler

    // Initialize custom uniforms
    this._chromaticAberration = uniform(0.05)
    this._anisotropicBlur = uniform(0.1)
    this._time = uniform(0)
    this._distortion = uniform(0.0)
    this._distortionScale = uniform(0.5)
    this._temporalDistortion = uniform(0.0)
    // Create a valid 1x1 white placeholder texture - will be replaced with FBO texture
    const placeholderTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
    placeholderTexture.needsUpdate = true
    this._buffer = uniformTexture(placeholderTexture)
    this._transmissionValue = uniform(1.0)

    // Base material setup
    // Set a small transmission value to enable the transmission code path
    // but we handle the actual transmission ourselves
    this.transmission = transmissionSampler ? 1 : 0.001
    this.roughness = 0
    this.thickness = 0
    this.ior = 1.5
    this.transparent = true
  }

  setupLightingModel(/* builder */) {
    if (this._transmissionSampler) {
      // Use default Three.js transmission (built-in sampler)
      return super.setupLightingModel()
    }

    // Use our custom lighting model with FBO-based transmission
    return new TransmissionLightingModel(
      {
        clearcoat: this.useClearcoat,
        sheen: this.useSheen,
        iridescence: this.useIridescence,
        anisotropy: this.useAnisotropy,
        dispersion: this.useDispersion,
      },
      {
        bufferTex: this._buffer,
        chromaticAberration: this._chromaticAberration,
        anisotropicBlur: this._anisotropicBlur,
        timeUniform: this._time,
        distortion: this._distortion,
        distortionScale: this._distortionScale,
        temporalDistortion: this._temporalDistortion,
        samples: this._samples,
      }
    )
  }

  //* Property Accessors ==============================

  get time() {
    return this._time.value
  }
  set time(v: number) {
    this._time.value = v
  }

  get buffer() {
    return this._buffer.value
  }
  set buffer(v: THREE.Texture) {
    this._buffer.value = v
  }

  get chromaticAberration() {
    return this._chromaticAberration.value
  }
  set chromaticAberration(v: number) {
    this._chromaticAberration.value = v
  }

  get anisotropicBlur() {
    return this._anisotropicBlur.value
  }
  set anisotropicBlur(v: number) {
    this._anisotropicBlur.value = v
  }

  get distortion() {
    return this._distortion.value
  }
  set distortion(v: number) {
    this._distortion.value = v
  }

  get distortionScale() {
    return this._distortionScale.value
  }
  set distortionScale(v: number) {
    this._distortionScale.value = v
  }

  get temporalDistortion() {
    return this._temporalDistortion.value
  }
  set temporalDistortion(v: number) {
    this._temporalDistortion.value = v
  }

  // Expose _transmission for legacy compatibility
  // This stores the user's intended transmission value, separate from the base class's transmission
  // which is kept at 0.001 to enable the transmission code path without triggering Three's internal rendering
  get _transmission() {
    if (!this._transmissionValue) {
      this._transmissionValue = uniform(1.0)
    }
    return this._transmissionValue.value
  }
  set _transmission(v: number) {
    if (!this._transmissionValue) {
      this._transmissionValue = uniform(1.0)
    }
    this._transmissionValue.value = v
    // Note: Do NOT set this.transmission here - it causes infinite recursion
    // The base class transmission is set in constructor and stays constant
  }
}

//* React Component ==============================

/**
 * Improved MeshPhysicalMaterial with chromatic aberration, noise-based blur,
 * and ability to see other transmissive/transparent objects.
 *
 * @example Basic usage
 * ```jsx
 * <mesh>
 *   <sphereGeometry />
 *   <MeshTransmissionMaterial thickness={0.5} roughness={0} />
 * </mesh>
 * ```
 *
 * @example Shared buffer for performance
 * ```jsx
 * <MeshTransmissionMaterial transmissionSampler />
 * ```
 */
export const MeshTransmissionMaterial: ForwardRefComponent<
  MeshTransmissionMaterialProps,
  ThreeElements['meshTransmissionMaterial']
> = /* @__PURE__ */ React.forwardRef(
  (
    {
      buffer,
      transmissionSampler = false,
      backside = false,
      side = THREE.FrontSide,
      transmission = 1,
      thickness = 0,
      backsideThickness = 0,
      backsideEnvMapIntensity = 1,
      samples = 10,
      resolution,
      backsideResolution,
      background,
      anisotropy,
      anisotropicBlur,
      ...props
    }: MeshTransmissionMaterialProps,
    fref
  ) => {
    extend({ MeshTransmissionMaterial: MeshTransmissionMaterialImpl })

    const ref = React.useRef<any>(null!)
    // Create a second material instance for backside pass to avoid texture swapping conflicts
    const backsideMaterialRef = React.useRef<any>(null)
    const fboBack = useFBO(backsideResolution || resolution)
    const fboMain = useFBO(resolution)

    // Initialize backside material on first render
    React.useEffect(() => {
      if (backside && ref.current && !backsideMaterialRef.current) {
        // Create a clone for backside pass - this has its own buffer uniform
        backsideMaterialRef.current = new MeshTransmissionMaterialImpl(samples, transmissionSampler)
        // Copy properties
        backsideMaterialRef.current.buffer = fboBack.texture
      }
      return () => {
        if (backsideMaterialRef.current) {
          backsideMaterialRef.current.dispose()
          backsideMaterialRef.current = null
        }
      }
    }, [backside, samples, transmissionSampler])

    // Update backside material buffer when fboBack changes
    React.useEffect(() => {
      if (backsideMaterialRef.current) {
        backsideMaterialRef.current.buffer = fboBack.texture
      }
    }, [fboBack.texture])

    let oldBg: any
    let oldEnvMapIntensity: number
    let oldTone: THREE.ToneMapping
    let parent: THREE.Object3D | undefined

    useFrame((state) => {
      ref.current.time = state.elapsed
      if (backsideMaterialRef.current) {
        backsideMaterialRef.current.time = state.elapsed
      }

      // Render only if the buffer matches the built-in and no transmission sampler is set
      if (ref.current.buffer === fboMain.texture && !transmissionSampler) {
        parent = (ref.current as any).__r3f?.parent?.object as THREE.Object3D | undefined

        if (parent) {
          // Save defaults
          oldTone = state.gl.toneMapping
          oldBg = state.scene.background
          oldEnvMapIntensity = ref.current.envMapIntensity

          // Switch off tonemapping lest it double tone maps
          // Save the current background and set the HDR as the new BG
          state.gl.toneMapping = THREE.NoToneMapping
          if (background) state.scene.background = background

          // Use discardmaterial - parent invisible but shadows still cast
          ;(parent as any).material = DiscardMaterial

          if (backside && backsideMaterialRef.current) {
            // PASS 1: Render scene to fboBack (mesh invisible via DiscardMaterial)
            state.gl.setRenderTarget(fboBack)
            state.gl.clear()
            state.renderer.render(state.scene, state.camera)

            // PASS 2: Use SEPARATE material that samples fboBack, writes to fboMain
            // This material's buffer is permanently set to fboBack.texture
            ;(parent as any).material = backsideMaterialRef.current
            backsideMaterialRef.current.thickness = backsideThickness
            backsideMaterialRef.current.side = THREE.BackSide
            backsideMaterialRef.current.envMapIntensity = backsideEnvMapIntensity

            state.gl.setRenderTarget(fboMain)
            state.gl.clear()
            state.renderer.render(state.scene, state.camera)

            // PASS 3 prep: Switch to main material for final screen render
            // Main material's buffer is permanently fboMain.texture
            ;(parent as any).material = ref.current
            ref.current.thickness = thickness
            ref.current.side = side
            ref.current.envMapIntensity = oldEnvMapIntensity
          } else {
            // NO BACKSIDE: Render scene to fboMain (mesh invisible via DiscardMaterial)
            state.gl.setRenderTarget(fboMain)
            state.gl.clear()
            state.renderer.render(state.scene, state.camera)

            // Switch to main material for final screen render
            ;(parent as any).material = ref.current
            ref.current.thickness = thickness
            ref.current.side = side
          }

          // Restore state for final screen render
          state.scene.background = oldBg
          state.gl.setRenderTarget(null)
          state.gl.toneMapping = oldTone
        }
      }
    })

    // Forward ref
    React.useImperativeHandle(fref, () => ref.current, [])

    return (
      <meshTransmissionMaterial
        // Samples must re-compile the shader so we memoize it
        args={[samples, transmissionSampler]}
        ref={ref as any}
        {...props}
        buffer={buffer || fboMain.texture}
        // @ts-ignore
        _transmission={transmission}
        // In order for this to not incur extra cost "transmission" must be set to 0 and treated as a reserved prop.
        // This is because THREE.WebGLRenderer will check for transmission > 0 and execute extra renders.
        // The exception is when transmissionSampler is set, in which case we are using three's built in sampler.
        anisotropicBlur={anisotropicBlur ?? anisotropy}
        thickness={thickness}
        side={side}
      />
    )
  }
)

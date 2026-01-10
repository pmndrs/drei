//* MeshTransmissionMaterial - TSL WebGPU Implementation ==============================
// Transmission material with chromatic aberration, distortion, and custom refraction sampling
// Original Author: @N8Programs https://github.com/N8python
//   https://gist.github.com/N8python/eb42d25c7cd00d12e965ac9cba544317
// Inspired by: @ore_ukonpower and http://next.junni.co.jp
//   https://github.com/junni-inc/next.junni.co.jp/blob/master/src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/shaders/transparent.fs
// TSL Conversion: drei webgpu migration - Dennis Smolek

import * as THREE from 'three/webgpu'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec2,
  vec3,
  vec4,
  float,
  int,
  texture,
  uv,
  positionWorld,
  normalWorld,
  normalize,
  dot,
  length,
  refract,
  clamp,
  max,
  min,
  mix,
  pow,
  exp,
  log,
  floor,
  fract,
  sin,
  select,
  abs,
  cameraPosition,
  cameraViewMatrix,
  cameraProjectionMatrix,
  screenCoordinate,
  Loop,
  diffuseColor,
  // TSL built-in noise functions
  mx_fractal_noise_vec3,
} from 'three/tsl'
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
  /** Transmission, default: 1 */
  transmission?: number
  /** Thickness (refraction), default: 0 */
  thickness?: number
  /** Roughness (blur), default: 0 */
  roughness?: number
  /** Chromatic aberration, default: 0.03 */
  chromaticAberration?: number
  /** Anisotropy, default: 0.1 */
  anisotropy?: number
  /** AnisotropicBlur, default: 0.1 */
  anisotropicBlur?: number
  /** Distortion, default: 0 */
  distortion?: number
  /** Distortion scale, default: 0.5 */
  distortionScale?: number
  /** Temporal distortion (speed of movement), default: 0.0 */
  temporalDistortion?: number
  /** The scene rendered into a texture (use it to share a texture between materials), default: null */
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
  /** Backside environment map intensity, default: 1 */
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

//* TSL Noise Helpers ==============================

// Simple hash-based random using sine (for per-fragment randomization)
const rand = /* @__PURE__ */ Fn(({ seed, fragCoord }: { seed: any; fragCoord: any }) => {
  return fract(sin(dot(vec3(fragCoord.xy, seed), vec3(12.9898, 78.233, 45.164))).mul(43758.5453))
})

//* Volume Attenuation (Beer's Law) ==============================
// Simulates light absorption as it travels through a transmissive medium

const applyVolumeAttenuation = /* @__PURE__ */ Fn(
  ({
    radiance,
    transmissionDistance,
    attenuationColor,
    attenuationDistance,
  }: {
    radiance: any
    transmissionDistance: any
    attenuationColor: any
    attenuationDistance: any
  }) => {
    // If attenuation distance is very large (effectively infinite), no attenuation
    const isInfinite = attenuationDistance.greaterThan(1e10)

    // Compute attenuation coefficient: -log(color) / distance
    // Using max to avoid log(0)
    const safeColor = max(attenuationColor, vec3(0.0001))
    const attenuationCoefficient = log(safeColor).negate().div(attenuationDistance)

    // Beer's law: transmittance = exp(-coefficient * distance)
    const transmittance = exp(attenuationCoefficient.negate().mul(transmissionDistance))

    // Apply transmittance to radiance, or pass through if infinite distance
    return select(isInfinite, radiance, transmittance.mul(radiance))
  }
)

//* MeshTransmissionMaterial Implementation ==============================

class MeshTransmissionMaterialImpl extends MeshPhysicalNodeMaterial {
  //* Private Uniform Nodes --
  private _chromaticAberration: THREE.UniformNode<number>
  private _anisotropicBlur: THREE.UniformNode<number>
  private _time: THREE.UniformNode<number>
  private _distortion: THREE.UniformNode<number>
  private _distortionScale: THREE.UniformNode<number>
  private _temporalDistortion: THREE.UniformNode<number>
  private _buffer: THREE.TextureNode
  private _transmissionValue: THREE.UniformNode<number>
  private _attenuationDistance: THREE.UniformNode<number>
  private _attenuationColor: THREE.UniformNode<THREE.Color>
  private _samples: number
  private _transmissionSampler: boolean

  /** Type flag for identification */
  readonly isMeshTransmissionMaterial = true

  constructor(samples = 6, transmissionSampler = false) {
    super()

    this._samples = samples
    this._transmissionSampler = transmissionSampler

    //* Initialize Uniforms --
    this._chromaticAberration = uniform(0.05)
    this._anisotropicBlur = uniform(0.1)
    this._time = uniform(0)
    this._distortion = uniform(0.0)
    this._distortionScale = uniform(0.5)
    this._temporalDistortion = uniform(0.0)
    this._buffer = uniformTexture(new THREE.Texture())
    this._transmissionValue = uniform(1.0)
    this._attenuationDistance = uniform(Infinity)
    this._attenuationColor = uniform(new THREE.Color('white'))

    //* Base Material Properties --
    // Set transmission to 0 unless using built-in sampler (to avoid double rendering)
    this.transmission = transmissionSampler ? 1 : 0
    this.roughness = 0
    this.thickness = 0
    this.envMapIntensity = 1

    // Only build custom transmission if not using built-in sampler
    if (!transmissionSampler) {
      this._buildTransmissionShader()
    }
  }

  private _buildTransmissionShader() {
    //* Capture uniforms for closure --
    const chromaticAberrationUniform = this._chromaticAberration
    const anisotropicBlurUniform = this._anisotropicBlur
    const timeUniform = this._time
    const distortionUniform = this._distortion
    const distortionScaleUniform = this._distortionScale
    const temporalDistortionUniform = this._temporalDistortion
    const bufferTex = this._buffer
    const transmissionUniform = this._transmissionValue
    const attenuationDistanceUniform = this._attenuationDistance
    const attenuationColorUniform = this._attenuationColor
    const samples = this._samples

    // Store reference to material for accessing properties in shader
    const materialRef = this

    //* Custom Transmission Shader --
    // Computes refracted color by sampling the buffer texture with chromatic aberration
    // and blends it with the material's diffuse color based on transmission amount

    this.outputNode = Fn(() => {
      const pos = positionWorld
      const fragCoord = screenCoordinate.xy

      // View direction and normal
      const v = normalize(cameraPosition.sub(pos))
      const n = normalWorld

      // Initialize transmission accumulator
      const transmission = vec3(0.0, 0.0, 0.0).toVar()

      // Running seed for pseudo-random sampling
      const runningSeed = float(0.0).toVar()

      // Random offset for this fragment (temporal stability)
      const randomCoords = rand({ seed: runningSeed, fragCoord })
      runningSeed.addAssign(1.0)

      // Material properties as uniforms
      const roughnessFactor = float(materialRef.roughness).toVar()
      const thicknessVal = float(materialRef.thickness)
      const iorVal = float(materialRef.ior)

      // Thickness smear based on roughness and anisotropic blur
      // Creates blur variation across samples
      const thicknessSmear = thicknessVal.mul(max(pow(roughnessFactor, 0.33), anisotropicBlurUniform))

      //* Distortion using TSL fractal noise --
      const distortionNormal = vec3(0.0, 0.0, 0.0).toVar()
      const distortEnabled = distortionUniform.greaterThan(0.0)

      // Temporal offset for animated distortion
      const temporalOffset = vec3(timeUniform, timeUniform.negate(), timeUniform.negate()).mul(
        temporalDistortionUniform
      )

      // Use TSL's built-in fractal noise for distortion
      const noiseInput = pos.mul(distortionScaleUniform).add(temporalOffset)
      const noiseResult = mx_fractal_noise_vec3(noiseInput, int(4), float(2.0), float(0.5))
      const computedDistortion = noiseResult.mul(distortionUniform)
      distortionNormal.assign(select(distortEnabled, computedDistortion, vec3(0.0)))

      //* Multi-sample refraction loop --
      // Samples the scene buffer multiple times with varying IOR for chromatic aberration

      Loop(samples, ({ i }) => {
        const fi = float(i)

        // Random sample direction with roughness-based spread
        const randX = rand({ seed: runningSeed, fragCoord }).sub(0.5)
        runningSeed.addAssign(1.0)
        const randY = rand({ seed: runningSeed, fragCoord }).sub(0.5)
        runningSeed.addAssign(1.0)
        const randZ = rand({ seed: runningSeed, fragCoord }).sub(0.5)
        runningSeed.addAssign(1.0)
        const randW = rand({ seed: runningSeed, fragCoord })
        runningSeed.addAssign(1.0)

        // Roughness-weighted random direction
        const randomDir = normalize(vec3(randX, randY, randZ)).mul(pow(randW, 0.33))

        // Perturbed normal with roughness, random direction, and distortion
        const sampleNorm = normalize(
          n.add(roughnessFactor.mul(roughnessFactor).mul(2.0).mul(randomDir)).add(distortionNormal)
        )

        // Calculate refraction ray for RED channel (base IOR)
        const refractionDir = refract(v.negate(), sampleNorm, float(1.0).div(iorVal))

        // Thickness for this sample (varies across samples for blur)
        const sampleThickness = thicknessVal.add(thicknessSmear.mul(fi.add(randomCoords)).div(float(samples)))

        // Exit point of refracted ray
        const refractedExit = pos.add(refractionDir.mul(sampleThickness))

        // Project to screen space
        const clipPos = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(refractedExit, 1.0)))
        const ndcPos = clipPos.xyz.div(clipPos.w)
        const refractionUV = ndcPos.xy.mul(0.5).add(0.5)

        // Sample buffer - RED channel
        const sampledColor = texture(bufferTex, refractionUV)
        const transmissionR = sampledColor.r

        //* GREEN channel - with chromatic aberration offset on IOR --
        const chromaticOffsetG = chromaticAberrationUniform.mul(fi.add(randomCoords)).div(float(samples))
        const iorG = iorVal.mul(float(1.0).add(chromaticOffsetG))
        const refractionDirG = refract(v.negate(), sampleNorm, float(1.0).div(iorG))
        const refractedExitG = pos.add(refractionDirG.mul(sampleThickness))
        const clipPosG = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(refractedExitG, 1.0)))
        const ndcPosG = clipPosG.xyz.div(clipPosG.w)
        const refractionUVG = ndcPosG.xy.mul(0.5).add(0.5)
        const transmissionG = texture(bufferTex, refractionUVG).g

        //* BLUE channel - with 2x chromatic aberration offset --
        const chromaticOffsetB = chromaticAberrationUniform.mul(2.0).mul(fi.add(randomCoords)).div(float(samples))
        const iorB = iorVal.mul(float(1.0).add(chromaticOffsetB))
        const refractionDirB = refract(v.negate(), sampleNorm, float(1.0).div(iorB))
        const refractedExitB = pos.add(refractionDirB.mul(sampleThickness))
        const clipPosB = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(refractedExitB, 1.0)))
        const ndcPosB = clipPosB.xyz.div(clipPosB.w)
        const refractionUVB = ndcPosB.xy.mul(0.5).add(0.5)
        const transmissionB = texture(bufferTex, refractionUVB).b

        // Accumulate RGB transmission
        transmission.x.addAssign(transmissionR)
        transmission.y.addAssign(transmissionG)
        transmission.z.addAssign(transmissionB)
      })

      // Average samples
      const avgTransmission = transmission.div(float(samples))

      //* Apply volume attenuation (Beer's Law) --
      // Light is absorbed as it travels through the medium
      const transmissionRayLength = thicknessVal // Simplified: use thickness as ray length
      const attenuatedTransmission = applyVolumeAttenuation({
        radiance: avgTransmission,
        transmissionDistance: transmissionRayLength,
        attenuationColor: attenuationColorUniform,
        attenuationDistance: attenuationDistanceUniform,
      })

      //* Blend transmission with diffuse color --
      // Mix between material's diffuse color and transmitted light based on transmission amount
      const baseDiffuse = diffuseColor.rgb
      const finalColor = mix(baseDiffuse, attenuatedTransmission, transmissionUniform)

      return vec4(finalColor, diffuseColor.a)
    })()
  }

  //* Uniform Accessors ==============================

  /** Chromatic aberration strength, default: 0.05 */
  get chromaticAberration() {
    return this._chromaticAberration.value as number
  }
  set chromaticAberration(v: number) {
    this._chromaticAberration.value = v
  }

  /** Anisotropic blur amount, default: 0.1 */
  get anisotropicBlur() {
    return this._anisotropicBlur.value as number
  }
  set anisotropicBlur(v: number) {
    this._anisotropicBlur.value = v
  }

  /** Animation time (set from useFrame), default: 0 */
  get time() {
    return this._time.value as number
  }
  set time(v: number) {
    this._time.value = v
  }

  /** Noise distortion amount, default: 0 */
  get distortion() {
    return this._distortion.value as number
  }
  set distortion(v: number) {
    this._distortion.value = v
  }

  /** Distortion noise scale, default: 0.5 */
  get distortionScale() {
    return this._distortionScale.value as number
  }
  set distortionScale(v: number) {
    this._distortionScale.value = v
  }

  /** Temporal distortion speed, default: 0 */
  get temporalDistortion() {
    return this._temporalDistortion.value as number
  }
  set temporalDistortion(v: number) {
    this._temporalDistortion.value = v
  }

  /** Scene buffer texture for refraction sampling */
  get buffer() {
    return this._buffer.value as THREE.Texture
  }
  set buffer(v: THREE.Texture | null) {
    this._buffer.value = v ?? new THREE.Texture()
  }

  /** Internal transmission value (use transmission prop instead) */
  get _transmission() {
    return this._transmissionValue.value as number
  }
  set _transmission(v: number) {
    this._transmissionValue.value = v
  }

  /** Attenuation distance for Beer's law absorption */
  get attenuationDistance() {
    return this._attenuationDistance.value as number
  }
  set attenuationDistance(v: number) {
    this._attenuationDistance.value = v
  }

  /** Attenuation color for Beer's law absorption */
  get attenuationColor() {
    return this._attenuationColor.value as THREE.Color
  }
  set attenuationColor(v: THREE.Color) {
    this._attenuationColor.value = v
  }
}

//* React Component ==============================

export const MeshTransmissionMaterial: ForwardRefComponent<
  MeshTransmissionMaterialProps,
  MeshTransmissionMaterialImpl
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

    const ref = React.useRef<MeshTransmissionMaterialImpl>(null!)
    const [discardMaterial] = React.useState(() => DiscardMaterial)
    const fboBack = useFBO(backsideResolution || resolution)
    const fboMain = useFBO(resolution)

    let oldBg: THREE.Color | THREE.Texture | null
    let oldEnvMapIntensity: number
    let oldTone: THREE.ToneMapping
    let parent: THREE.Mesh | undefined

    useFrame((state) => {
      ref.current.time = state.elapsed

      // Render only if the buffer matches the built-in and no transmission sampler is set
      if (ref.current.buffer === fboMain.texture && !transmissionSampler) {
        parent = (ref.current as any).__r3f?.parent?.object as THREE.Mesh | undefined
        if (parent) {
          // Save defaults
          oldTone = state.gl.toneMapping
          oldBg = state.scene.background
          oldEnvMapIntensity = ref.current.envMapIntensity ?? 1

          // Switch off tonemapping lest it double tone maps
          // Save the current background and set the HDR as the new BG
          // Use discardmaterial, the parent will be invisible, but its shadows will still be cast
          state.gl.toneMapping = THREE.NoToneMapping
          if (background) state.scene.background = background as THREE.Texture | THREE.Color
          ;(parent as THREE.Mesh).material = discardMaterial

          if (backside) {
            // Render into the backside buffer
            state.gl.setRenderTarget(fboBack)
            state.gl.render(state.scene, state.camera)
            // And now prepare the material for the main render using the backside buffer
            ;(parent as THREE.Mesh).material = ref.current
            ref.current.buffer = fboBack.texture
            ref.current.thickness = backsideThickness
            ref.current.side = THREE.BackSide
            ref.current.envMapIntensity = backsideEnvMapIntensity
          }

          // Render into the main buffer
          state.gl.setRenderTarget(fboMain)
          state.gl.render(state.scene, state.camera)
          ;(parent as THREE.Mesh).material = ref.current
          ref.current.thickness = thickness
          ref.current.side = side
          ref.current.buffer = fboMain.texture
          ref.current.envMapIntensity = oldEnvMapIntensity

          // Set old state back
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
        // @ts-ignore - internal prop for transmission value
        _transmission={transmission}
        // In order for this to not incur extra cost "transmission" must be set to 0 and treated as a reserved prop.
        // This is because THREE.WebGLRenderer will check for transmission > 0 and execute extra renders.
        // The exception is when transmissionSampler is set, in which case we are using three's built in sampler.
        anisotropicBlur={anisotropicBlur ?? anisotropy ?? 0.1}
        transmission={transmissionSampler ? transmission : 0}
        thickness={thickness}
        side={side}
      />
    )
  }
)

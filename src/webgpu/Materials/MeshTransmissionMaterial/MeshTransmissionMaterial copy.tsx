//* MeshTransmissionMaterial - TSL WebGPU Implementation ==============================
// Attempt to recreate transmission effects using TSL backdropNode
// Reference: https://github.com/mrdoob/three.js/blob/master/examples/webgpu_backdrop.html

import * as THREE from 'three/webgpu'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import {
  Fn,
  viewportSharedTexture,
  screenUV,
  vec2,
  select,
  vec4,
  float,
  uniform,
  normalView,
  faceDirection,
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

//* MeshTransmissionMaterial Implementation ==============================

class MeshTransmissionMaterialImpl extends MeshPhysicalNodeMaterial {
  /** Type flag for identification */
  readonly isMeshTransmissionMaterial = true

  // Uniforms for refraction - exposed so React component can update them
  _thicknessUniform = uniform(0)
  _iorUniform = uniform(1.5)

  constructor(samples = 6, transmissionSampler = false) {
    super()

    console.log('[MeshTransmissionMaterial] Constructor', { samples, transmissionSampler })

    // Base material setup - transparent for backdrop to work
    this.transparent = true
    this.transmission = 0 // Disable built-in transmission
    this.roughness = 0
    this.envMapIntensity = 1

    if (!transmissionSampler) {
      this._buildRefractionBackdrop()
      // Initialize thickness uniform after backdrop is built
      this._thicknessUniform.value = 0
    } else {
      // Use Three's built-in transmission
      this.transmission = 1
    }
  }

  private _buildRefractionBackdrop() {
    const thicknessUniform = this._thicknessUniform
    const iorUniform = this._iorUniform

    const refractionBackdrop = Fn(() => {
      // IOR factor: higher IOR = more bending (ior 1.5 -> factor ~1.0)
      const iorFactor = iorUniform.sub(1.0).mul(2.0)

      // Strength based on thickness and IOR
      const strength = thicknessUniform.mul(0.05).mul(iorFactor)

      // Offset based on view-space normal
      const offset = normalView.xy.mul(strength)

      // Only apply to front faces using select
      const isFrontFace = faceDirection.greaterThan(0.0)
      const finalOffset = select(isFrontFace, offset, vec2(0.0, 0.0))

      const offsetUV = screenUV.add(finalOffset)
      const backdrop = viewportSharedTexture(offsetUV)
      return backdrop
    })

    this.backdropNode = refractionBackdrop()
  }

  // Sync thickness with uniform
  override get thickness() {
    return super.thickness
  }
  override set thickness(v: number) {
    console.log('[MeshTransmissionMaterial] thickness setter called:', v, 'uniform exists:', !!this._thicknessUniform)
    super.thickness = v
    if (this._thicknessUniform) {
      this._thicknessUniform.value = v
      console.log('[MeshTransmissionMaterial] uniform updated to:', this._thicknessUniform.value)
    }
  }

  // Sync IOR with uniform
  override get ior() {
    return super.ior
  }
  override set ior(v: number) {
    super.ior = v
    if (this._iorUniform) this._iorUniform.value = v
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

    // Sync uniforms with props
    React.useEffect(() => {
      if (ref.current) {
        ref.current._thicknessUniform.value = thickness
      }
    }, [thickness])

    // Sync IOR from props (passed via ...props, default is 1.5 from MeshPhysicalMaterial)
    const ior = (props as any).ior ?? 1.5
    React.useEffect(() => {
      if (ref.current) {
        ref.current._iorUniform.value = ior
      }
    }, [ior])

    // Forward ref
    React.useImperativeHandle(fref, () => ref.current, [])

    return (
      <meshTransmissionMaterial
        args={[samples, transmissionSampler]}
        ref={ref as any}
        {...props}
        thickness={thickness}
        side={side}
      />
    )
  }
)

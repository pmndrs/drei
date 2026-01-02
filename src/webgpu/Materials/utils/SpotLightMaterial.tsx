//* SpotLightMaterial - TSL WebGPU Implementation ==============================
// Volumetric spotlight cone effect with distance attenuation and optional soft depth edges
// Used by SpotLight component to render light cone geometry

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec3,
  vec4,
  float,
  texture,
  positionWorld,
  positionView,
  normalView,
  normalize,
  dot,
  pow,
  distance,
  saturate,
  smoothstep,
  screenCoordinate,
  abs,
  select,
  varying,
} from 'three/tsl'

//* SpotLightMaterial ==============================
// Creates a volumetric cone effect for spotlights
// - Distance-based attenuation from spotlight position
// - Angle-based intensity falloff (anglePower)
// - Optional soft edges when intersecting geometry (depth buffer)

export class SpotLightMaterial extends MeshBasicNodeMaterial {
  // Private uniform nodes
  private _depth: THREE.TextureNode
  private _opacity: THREE.UniformNode<number>
  private _attenuation: THREE.UniformNode<number>
  private _anglePower: THREE.UniformNode<number>
  private _spotPosition: THREE.UniformNode<THREE.Vector3>
  private _lightColor: THREE.UniformNode<THREE.Color>
  private _cameraNear: THREE.UniformNode<number>
  private _cameraFar: THREE.UniformNode<number>
  private _resolution: THREE.UniformNode<THREE.Vector2>

  constructor() {
    super()

    //* Initialize Uniforms --
    this._depth = uniformTexture(new THREE.Texture())
    this._opacity = uniform(1)
    this._attenuation = uniform(2.5)
    this._anglePower = uniform(12)
    this._spotPosition = uniform(new THREE.Vector3(0, 0, 0))
    this._lightColor = uniform(new THREE.Color('white'))
    this._cameraNear = uniform(0)
    this._cameraFar = uniform(1)
    this._resolution = uniform(new THREE.Vector2(0, 0))

    //* Material Properties --
    this.transparent = true
    this.depthWrite = false

    this._buildShader()
  }

  private _buildShader() {
    // Capture uniforms for closure
    const depthTex = this._depth
    const opacityUniform = this._opacity
    const attenuationUniform = this._attenuation
    const anglePowerUniform = this._anglePower
    const spotPositionUniform = this._spotPosition
    const lightColorUniform = this._lightColor
    const cameraNearUniform = this._cameraNear
    const cameraFarUniform = this._cameraFar
    const resolutionUniform = this._resolution

    //* Vertex Data (computed as varyings) --
    // Compute intensity based on distance from spotlight position
    const vIntensity = varying(
      Fn(() => {
        const worldPos = positionWorld
        const dist = distance(worldPos, spotPositionUniform)
        return saturate(float(1.0).sub(dist.div(attenuationUniform)))
      })(),
      'vIntensity'
    )

    // View-space Z for depth comparison
    const vViewZ = varying(positionView.z, 'vViewZ')

    //* Helper: Convert perspective depth to view Z --
    // Formula: viewZ = (near * far) / ((far - near) * depth - far)
    const perspectiveDepthToViewZ = Fn(([depth, near, far]: [any, any, any]) => {
      const nearFar = near.mul(far)
      const farMinusNear = far.sub(near)
      return nearFar.div(farMinusNear.mul(depth).sub(far))
    })

    //* Helper: Read depth buffer and convert to view Z --
    const readDepth = Fn(([depthSampler, sampleUv]: [any, any]) => {
      const fragCoordZ = texture(depthSampler, sampleUv).r

      // Reconstruct view Z from depth buffer
      const viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNearUniform, cameraFarUniform)

      return viewZ
    })

    //* Fragment Shader --
    this.colorNode = Fn(() => {
      // Get normal in view space, ensure Z is positive for backface handling
      const normal = vec3(normalView.x, normalView.y, abs(normalView.z))

      // Angle-based intensity: pow(dot(normal, forward), anglePower)
      const angleIntensity = pow(dot(normalize(normal), vec3(0, 0, 1)), anglePowerUniform)

      // Combine distance and angle attenuation
      const intensity = vIntensity.mul(angleIntensity).toVar()

      //* Soft Edges (depth buffer intersection) --
      // Only apply if resolution is set (> 0)
      const isSoft = resolutionUniform.x.greaterThan(0.0).and(resolutionUniform.y.greaterThan(0.0))

      // Compute screen UV from fragment coordinates
      const screenUv = screenCoordinate.xy.div(resolutionUniform)

      // Read scene depth and compute soft factor
      const sceneDepth = readDepth(depthTex, screenUv)
      const softFactor = smoothstep(float(0.0), float(1.0), vViewZ.sub(sceneDepth))

      // Apply soft edges conditionally
      intensity.assign(select(isSoft, intensity.mul(softFactor), intensity))

      //* Final Output --
      return vec4(lightColorUniform, intensity.mul(opacityUniform))
    })()
  }

  //* Uniform Accessors ==============================

  get depth() {
    return this._depth.value as THREE.Texture
  }
  set depth(v: THREE.Texture | null) {
    this._depth.value = v ?? new THREE.Texture()
  }

  get opacity() {
    return this._opacity.value as number
  }
  set opacity(v: number) {
    this._opacity.value = v
  }

  get attenuation() {
    return this._attenuation.value as number
  }
  set attenuation(v: number) {
    this._attenuation.value = v
  }

  get anglePower() {
    return this._anglePower.value as number
  }
  set anglePower(v: number) {
    this._anglePower.value = v
  }

  get spotPosition() {
    return this._spotPosition.value as THREE.Vector3
  }
  set spotPosition(v: THREE.Vector3) {
    this._spotPosition.value = v
  }

  get lightColor() {
    return this._lightColor.value as THREE.Color
  }
  set lightColor(v: THREE.Color) {
    this._lightColor.value = v
  }

  get cameraNear() {
    return this._cameraNear.value as number
  }
  set cameraNear(v: number) {
    this._cameraNear.value = v
  }

  get cameraFar() {
    return this._cameraFar.value as number
  }
  set cameraFar(v: number) {
    this._cameraFar.value = v
  }

  get resolution() {
    return this._resolution.value as THREE.Vector2
  }
  set resolution(v: THREE.Vector2) {
    this._resolution.value = v
  }
}

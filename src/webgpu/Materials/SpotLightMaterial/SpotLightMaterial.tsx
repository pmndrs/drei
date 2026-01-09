//* SpotLightMaterial - TSL Native Implementation ==============================
// Volumetric spotlight cone effect using Three.js Shading Language (TSL)
// Based on John Chapman's "Good Enough Volumetrics for Spotlights"
// https://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html
//
// Key principles:
// - Distance falloff: Fade based on distance from cone tip
// - Angle falloff: Fade at cone edges based on surface orientation vs camera
// - Soft intersection: Fade where cone geometry intersects scene geometry (using depth buffer)

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec4,
  vec2,
  float,
  positionWorld,
  positionView,
  normalLocal,
  modelViewMatrix,
  screenCoordinate,
  texture,
  normalize,
  distance,
  saturate,
  pow,
  abs,
  smoothstep,
  varying,
  select,
  log2,
  exp2,
} from 'three/tsl'

//* SpotLightMaterial ==============================

export class SpotLightMaterial extends MeshBasicNodeMaterial {
  //* Private Uniform Nodes --
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
    this._attenuation = uniform(5)
    this._anglePower = uniform(5)
    this._spotPosition = uniform(new THREE.Vector3(0, 0, 0))
    this._lightColor = uniform(new THREE.Color('white'))
    this._cameraNear = uniform(0.1)
    this._cameraFar = uniform(100)
    this._resolution = uniform(new THREE.Vector2(0, 0))

    //* Material Settings --
    // As per John Chapman's article:
    // - Additive blending (we use alpha for soft volumetric look)
    // - No face culling (DoubleSide - see inside and outside of cone)
    // - Depth writes disabled, depth test enabled
    this.transparent = true
    this.depthWrite = false
    this.side = THREE.DoubleSide

    this._buildShader()
  }

  //* Build TSL Shader ==============================
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

    //* VERTEX: View-space normal for angle calculation --
    // Transform local normal to view space
    // modelViewMatrix.transformDirection() properly transforms direction vectors
    const vNormal = varying(normalize(modelViewMatrix.transformDirection(normalLocal)), 'vNormal')

    //* VERTEX: Distance-based intensity --
    // Fade based on distance from cone tip (spotPosition)
    // intensity = 1 - saturate(distance / attenuation)
    const vIntensity = varying(
      saturate(float(1).sub(distance(positionWorld, spotPositionUniform).div(attenuationUniform))),
      'vIntensity'
    )

    //* VERTEX: View-space Z for depth comparison --
    const vViewZ = varying(positionView.z, 'vViewZ')

    //* FRAGMENT: Final color calculation --
    this.colorNode = Fn(() => {
      // Angle falloff: how much the surface faces the camera
      // In view space, Z axis points toward camera
      // Using abs(vNormal.z) handles both front and back faces
      const angleIntensity = pow(abs(vNormal.z), anglePowerUniform)

      // Combine distance and angle falloff
      const intensity = vIntensity.mul(angleIntensity).toVar()

      //* Soft Edges (depth buffer intersection) --
      // Only active when resolution is non-zero (depthBuffer was provided)
      const hasDepth = resolutionUniform.x.greaterThan(0)

      // Sample depth texture at screen coordinates
      // Flip Y to match render target coordinate system
      const screenUV = vec2(
        screenCoordinate.x.div(resolutionUniform.x),
        float(1).sub(screenCoordinate.y.div(resolutionUniform.y))
      )
      const sampledDepth = texture(depthTex, screenUV).r

      // Convert sampled depth to view Z using Three.js perspectiveDepthToViewZ formula:
      // viewZ = (near * far) / ((far - near) * depth - far)
      // This returns negative values for points in front of camera
      const near = cameraNearUniform
      const far = cameraFarUniform
      const sceneViewZ = near.mul(far).div(far.sub(near).mul(sampledDepth).sub(far))

      // Soft factor: fade when cone is behind scene geometry
      // vViewZ is fragment's view Z (negative), sceneViewZ is scene's view Z (negative)
      // When cone fragment is behind scene: vViewZ < sceneViewZ → difference is negative → fade
      const depthDiff = vViewZ.sub(sceneViewZ)
      const softFactor = smoothstep(float(0), float(1), depthDiff)

      // Apply soft edges only when depth buffer is provided
      intensity.assign(select(hasDepth, intensity.mul(softFactor), intensity))

      // Output: color with intensity-based alpha
      return vec4(lightColorUniform, intensity.mul(opacityUniform))
    })()
  }

  //* Uniform Accessors ==============================

  get depth() {
    return this._depth?.value as THREE.Texture
  }
  set depth(v: THREE.Texture | null) {
    if (this._depth) this._depth.value = v ?? new THREE.Texture()
  }

  get opacity() {
    return this._opacity?.value as number
  }
  set opacity(v: number) {
    if (this._opacity) this._opacity.value = v
  }

  get attenuation() {
    return this._attenuation?.value as number
  }
  set attenuation(v: number) {
    if (this._attenuation) this._attenuation.value = v
  }

  get anglePower() {
    return this._anglePower?.value as number
  }
  set anglePower(v: number) {
    if (this._anglePower) this._anglePower.value = v
  }

  get spotPosition() {
    return this._spotPosition?.value as THREE.Vector3
  }
  set spotPosition(v: THREE.Vector3) {
    if (this._spotPosition) this._spotPosition.value = v
  }

  get lightColor() {
    return this._lightColor?.value as THREE.Color
  }
  set lightColor(v: THREE.Color) {
    if (this._lightColor) this._lightColor.value = v
  }

  get cameraNear() {
    return this._cameraNear?.value as number
  }
  set cameraNear(v: number) {
    if (this._cameraNear) this._cameraNear.value = v
  }

  get cameraFar() {
    return this._cameraFar?.value as number
  }
  set cameraFar(v: number) {
    if (this._cameraFar) this._cameraFar.value = v
  }

  get resolution() {
    return this._resolution?.value as THREE.Vector2
  }
  set resolution(v: THREE.Vector2) {
    if (this._resolution) this._resolution.value = v
  }
}

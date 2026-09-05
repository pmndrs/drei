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
  normalize,
  distance,
  saturate,
  pow,
  abs,
  smoothstep,
  varying,
  select,
  materialOpacity,
} from 'three/tsl'
import { withUniforms } from '@utils/withUniforms'

//* SpotLightMaterial ==============================

export class SpotLightMaterial extends withUniforms(MeshBasicNodeMaterial, {
  /** Scene depth (in the R channel) for soft intersection with scene geometry */
  depth: () => uniformTexture(new THREE.Texture()),
  /** Distance attenuation factor, default: 5 */
  attenuation: () => uniform(5),
  /** Angle falloff power - higher = sharper edges, default: 5 */
  anglePower: () => uniform(5),
  /** World position of the cone tip */
  spotPosition: () => uniform(new THREE.Vector3(0, 0, 0)),
  /** Light color, default: white */
  lightColor: () => uniform(new THREE.Color('white')),
  /** Camera near plane, for depth reconstruction */
  cameraNear: () => uniform(0.1),
  /** Camera far plane, for depth reconstruction */
  cameraFar: () => uniform(100),
  /** Drawing-buffer size in pixels. Zero disables depth-based soft edges. */
  resolution: () => uniform(new THREE.Vector2(0, 0)),
}) {
  constructor() {
    super()

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
    const {
      depth: depthTex,
      attenuation: attenuationUniform,
      anglePower: anglePowerUniform,
      spotPosition: spotPositionUniform,
      lightColor: lightColorUniform,
      cameraNear: cameraNearUniform,
      cameraFar: cameraFarUniform,
      resolution: resolutionUniform,
    } = this.uniforms

    //* VERTEX: View-space normal for angle calculation --
    // Transform local normal to view space
    // modelViewMatrix.transformDirection() properly transforms direction vectors
    const vNormal = varying<'vec3'>(normalize(modelViewMatrix.transformDirection(normalLocal)), 'vNormal')

    //* VERTEX: Distance-based intensity --
    // Fade based on distance from cone tip (spotPosition)
    // intensity = 1 - saturate(distance / attenuation)
    const vIntensity = varying<'float'>(
      saturate(float(1).sub(distance(positionWorld, spotPositionUniform).div(attenuationUniform))),
      'vIntensity'
    )

    //* VERTEX: View-space Z for depth comparison --
    const vViewZ = varying<'float'>(positionView.z, 'vViewZ')

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
      const sampledDepth = depthTex.sample(screenUV).r

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

      // Output: color with intensity-based alpha, scaled by three's own opacity
      return vec4(lightColorUniform, intensity.mul(materialOpacity))
    })()
  }
}

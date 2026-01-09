import { SpriteNodeMaterial } from '#three'
import {
  Fn,
  attribute,
  uniform,
  float,
  vec2,
  vec3,
  vec4,
  positionLocal,
  positionView,
  cameraViewMatrix,
  modelWorldMatrix,
  sin,
  cos,
  uv,
  length,
} from 'three/tsl'

//* SparklesMaterial - WebGPU TSL Material for Instanced Quad Sparkles ==============================
// Based on https://webgpufundamentals.org/webgpu/lessons/webgpu-points.html
//
// WebGPU only supports 1px point primitives, so we use instanced quads instead.
// Each sparkle is a billboarded quad instance with:
// - Instance attributes: particlePosition, size, speed, opacity, noise, color
// - Vertex shader: positions quad corners, applies size & distance attenuation, animates
// - Fragment shader: uses quad UV for radial glow effect (like gl_PointCoord)

export class SparklesMaterial extends SpriteNodeMaterial {
  // Uniforms exposed for external updates
  private _time = uniform(0)
  private _pixelRatio = uniform(1)

  // @ts-ignore - NodeMaterial properties from parent class
  declare positionNode: ReturnType<typeof Fn>
  // @ts-ignore - NodeMaterial properties from parent class
  declare scaleNode: ReturnType<typeof Fn>
  // @ts-ignore - NodeMaterial properties from parent class
  declare colorNode: ReturnType<typeof Fn>

  constructor() {
    super()

    // @ts-ignore - Material properties
    this.transparent = true
    // @ts-ignore - Material properties
    this.depthWrite = false

    //* Read Instance Attributes ==============================
    // These come from InstancedBufferAttributes on the geometry
    const particlePosition = attribute('particlePosition', 'vec3')
    const particleSize = attribute('size', 'float')
    const particleSpeed = attribute('speed', 'float')
    const particleOpacity = attribute('opacity', 'float')
    const particleNoise = attribute('noise', 'vec3')
    const particleColor = attribute('color', 'vec3')

    //* Position Node - Animated particle position ==============================
    // Apply noise-based animation to the particle center position
    this.positionNode = Fn(() => {
      const pos = particlePosition.toVar()

      // Apply animated noise displacement (same as legacy)
      // modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2
      pos.y.addAssign(sin(this._time.mul(particleSpeed).add(pos.x.mul(particleNoise.x).mul(100))).mul(0.2))
      // modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2
      pos.z.addAssign(cos(this._time.mul(particleSpeed).add(pos.x.mul(particleNoise.y).mul(100))).mul(0.2))
      // modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2
      pos.x.addAssign(cos(this._time.mul(particleSpeed).add(pos.x.mul(particleNoise.z).mul(100))).mul(0.2))

      return pos
    })()

    //* Scale Node - Size with distance attenuation ==============================
    // gl_PointSize = size * 25.0 * pixelRatio * (1.0 / -viewPosition.z)
    this.scaleNode = Fn(() => {
      // Get view-space position for distance calculation
      const worldPos = modelWorldMatrix.mul(vec4(this.positionNode, 1.0))
      const viewPos = cameraViewMatrix.mul(worldPos)
      // Distance attenuation: closer = larger
      const distanceAttenuation = float(1).div(viewPos.z.negate())
      // Scale factor (adjusted for quad vs point size difference)
      const size = particleSize.mul(0.5).mul(this._pixelRatio).mul(distanceAttenuation)
      return vec2(size)
    })()

    //* Fragment Color with Radial Glow ==============================
    this.colorNode = Fn(() => {
      // uv() gives us 0-1 coordinates across the quad (equivalent to gl_PointCoord)
      const quadUV = uv()
      // Distance from center (0.5, 0.5)
      const distanceToCenter = length(quadUV.sub(vec2(0.5)))
      // Glow strength: 0.05 / distance - 0.1 (same as legacy shader)
      const strength = float(0.05).div(distanceToCenter).sub(0.1)

      // Final color with alpha based on strength and opacity
      return vec4(particleColor, strength.mul(particleOpacity))
    })()
  }

  //* Uniform Accessors --------------------------------

  get time() {
    return this._time.value as number
  }
  set time(value) {
    this._time.value = value
  }

  get pixelRatio() {
    return this._pixelRatio.value as number
  }
  set pixelRatio(value) {
    this._pixelRatio.value = value
  }
}

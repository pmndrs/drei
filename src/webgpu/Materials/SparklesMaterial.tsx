import { SpriteNodeMaterial } from 'three/webgpu'
import {
  Fn,
  attribute,
  uniform,
  float,
  vec2,
  vec3,
  vec4,
  cameraProjectionMatrix,
  screenSize,
  sin,
  cos,
  uv,
  length,
  clamp,
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
    const particlePosition = attribute<'vec3'>('particlePosition', 'vec3')
    const particleSize = attribute<'float'>('size', 'float')
    const particleSpeed = attribute<'float'>('speed', 'float')
    const particleOpacity = attribute<'float'>('opacity', 'float')
    const particleNoise = attribute<'vec3'>('noise', 'vec3')
    const particleColor = attribute<'vec3'>('color', 'vec3')

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

    //* Scale Node - Size matching legacy gl_PointSize ==============================
    // Legacy: gl_PointSize = size * 25.0 * pixelRatio * (1.0 / -viewPosition.z)
    // For quads, the projection matrix already handles 1/-viewZ distance attenuation,
    // so we only convert from pixel-space point size to world-space quad size:
    // worldSize = pixelSize * 2.0 / (projectionMatrix[1][1] * viewportHeight)
    this.scaleNode = Fn(() => {
      const pixelSize = particleSize.mul(25.0).mul(this._pixelRatio)
      const projY = cameraProjectionMatrix.element(float(1)).y
      const viewportH = screenSize.y
      const size = pixelSize.mul(2.0).div(projY.mul(viewportH))
      return vec2(size)
    })()

    //* Fragment Color with Radial Glow ==============================
    // Note: colors may appear slightly different from legacy due to tonemapping differences
    // (legacy applies #include <tonemapping_fragment> which can shift hues, e.g. orange → yellow)
    this.colorNode = Fn(() => {
      // uv() gives us 0-1 coordinates across the quad (equivalent to gl_PointCoord)
      const quadUV = uv()
      // Distance from center (0.5, 0.5)
      const distanceToCenter = length(quadUV.sub(vec2(0.5)))
      // Glow strength: clamp(0.05 / distance - 0.1, 0.0, 1.0) (same as legacy shader)
      const strength = clamp(float(0.05).div(distanceToCenter).sub(0.1), 0.0, 1.0)

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

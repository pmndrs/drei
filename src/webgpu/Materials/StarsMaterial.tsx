import { SpriteNodeMaterial } from 'three/webgpu'
import { AdditiveBlending } from '#three'
import {
  Fn,
  attribute,
  uniform,
  float,
  vec2,
  vec4,
  cameraViewMatrix,
  modelWorldMatrix,
  sin,
  uv,
  length,
  exp,
  select,
} from 'three/tsl'

//* StarfieldMaterial - WebGPU TSL Material for Instanced Quad Stars ==============================
// Based on https://webgpufundamentals.org/webgpu/lessons/webgpu-points.html
//
// WebGPU only supports 1px point primitives, so we use instanced quads instead.
// Each star is a billboarded quad instance with:
// - Instance attributes: particlePosition, size, color
// - Vertex shader: positions quad center, applies size with distance attenuation & time animation
// - Fragment shader: uses quad UV for circular fade effect (like gl_PointCoord)

export class StarfieldMaterial extends SpriteNodeMaterial {
  //* Uniforms ==============================
  private _time = uniform(0.0)
  private _fade = uniform(1.0)

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
    // @ts-ignore - Material properties
    this.blending = AdditiveBlending

    //* Read Instance Attributes ==============================
    // These come from InstancedBufferAttributes on the geometry
    const particlePosition = attribute('particlePosition', 'vec3')
    const particleSize = attribute('size', 'float')
    const particleColor = attribute('color', 'vec3')

    //* Position Node - Star center position ==============================
    // Stars don't animate position, just return the particle position
    this.positionNode = Fn(() => {
      return particlePosition
    })()

    //* Scale Node - Size with distance attenuation and time animation ==============================
    // Based on legacy: gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0))
    // Note: scaleNode works in world units, not pixels, so we need a conversion factor
    // Animation amplitude reduced to prevent synchronized flash with 5000 additive stars
    this.scaleNode = Fn(() => {
      // Get view-space position for distance calculation
      const worldPos = modelWorldMatrix.mul(vec4(this.positionNode, 1.0))
      const viewPos = cameraViewMatrix.mul(worldPos)

      // Distance attenuation: 30.0 / -viewPos.z
      const distanceAttenuation = float(30.0).div(viewPos.z.negate())

      // Time-based twinkle animation: reduced amplitude (3.5 + 0.3*sin) vs original (3.0 + sin)
      // This prevents all stars pulsing to max size simultaneously causing bright flash
      const timeScale = float(3.5).add(sin(this._time.add(100.0)).mul(0.3))

      // Final size calculation - keep modest to avoid excessive overlap
      const size = particleSize.mul(distanceAttenuation).mul(timeScale).mul(0.04)

      return vec2(size)
    })()

    //* Fragment Color with Circular Masking ==============================
    // Unlike WebGL points which are inherently circular, quads need explicit circular masking
    // to avoid square artifacts. The "fade" option controls soft vs hard edge falloff.
    // Overall opacity reduced to prevent additive buildup causing bright flashes.
    this.colorNode = Fn(() => {
      // uv() gives us 0-1 coordinates across the quad (equivalent to gl_PointCoord)
      const quadUV = uv()

      // Distance from center (0.5, 0.5) - max is ~0.707 at corners
      const d = length(quadUV.sub(vec2(0.5)))

      // Soft circular fade: 1.0 / (1.0 + exp(16.0 * (d - 0.25)))
      // Creates smooth falloff from center
      const softFade = float(1.0).div(float(1.0).add(exp(float(16.0).mul(d.sub(0.25)))))

      // Hard circular mask: sharp cutoff with slight softness
      const hardMask = float(1.0).sub(d.smoothstep(0.3, 0.5))

      // Select based on fade uniform: soft fade or hard circle
      const circularOpacity = select(this._fade.equal(1.0), softFade, hardMask)

      // Reduce overall opacity to prevent additive buildup with thousands of stars
      const opacity = circularOpacity.mul(0.7)

      return vec4(particleColor, opacity)
    })()
  }

  //* Uniform Accessors ==============================

  setTime(time: number) {
    this._time.value = time
  }

  setFade(fade: number) {
    this._fade.value = fade
  }

  get time() {
    return this._time.value as number
  }
  set time(value) {
    this._time.value = value
  }

  get fade() {
    return this._fade.value as number
  }
  set fade(value) {
    this._fade.value = value
  }
}

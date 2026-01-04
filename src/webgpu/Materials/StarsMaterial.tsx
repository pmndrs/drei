import { ThreeElement } from '@react-three/fiber'
import { PointsNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  attribute,
  vertexColor,
  float,
  uv,
  vec2,
  vec4,
  length,
  exp,
  sin,
  time,
  select,
  modelViewMatrix,
  positionLocal,
} from 'three/tsl'

export class StarfieldMaterial extends PointsNodeMaterial {
  timeUniform: ReturnType<typeof uniform>
  fadeUniform: ReturnType<typeof uniform>

  sizeNode: ReturnType<typeof Fn>
  colorNode: ReturnType<typeof Fn>

  constructor() {
    super()

    //* Uniforms ==============================
    this.timeUniform = uniform(0.0)
    this.fadeUniform = uniform(1.0)

    const sizeAttr = attribute('size', 'float')

    //* Point Size Calculation ==============================
    // Scale points based on distance and animate with time
    this.sizeNode = Fn(() => {
      const pos = vec4(positionLocal, 0.5)
      const mvPosition = modelViewMatrix.mul(pos)
      const baseSize = sizeAttr.mul(float(30.0).div(mvPosition.z.negate()))
      const timeScale = float(3.0).add(sin(this.timeUniform.add(100.0)))
      return baseSize.mul(timeScale)
    })()

    //* Color and Opacity ==============================
    // Apply vertex colors and optional circular fade effect
    this.colorNode = Fn(() => {
      const color = vertexColor()

      // Calculate distance from center of point sprite
      const d = length(uv().sub(vec2(0.5)))

      // Apply fade effect: smooth circular falloff when enabled
      const opacity = select(
        this.fadeUniform.equal(1.0),
        float(1.0).div(float(1.0).add(exp(float(16.0).mul(d.sub(0.25))))),
        float(1.0)
      )

      return vec4(color, opacity)
    })()
  }

  setTime(time: number) {
    this.timeUniform.value = time
  }

  setFade(fade: number) {
    this.fadeUniform.value = fade
  }
}

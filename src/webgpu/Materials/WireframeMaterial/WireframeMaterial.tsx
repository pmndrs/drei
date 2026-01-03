//* WireframeMaterial - TSL WebGPU Implementation ==============================
// Wireframe material using barycentric coordinates for edge detection
// Features: anti-aliased edges, dashing, squeeze effect, backface coloring
// TSL Conversion: drei webgpu migration
//
// NOTE: Requires geometry to have 'barycentric' attribute. Use the helper
// function `setBarycentricCoordinates(geometry)` to add this attribute.

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  vec3,
  vec4,
  float,
  attribute,
  varying,
  min,
  max,
  mix,
  smoothstep,
  fract,
  sin,
  fwidth,
  select,
  frontFacing,
} from 'three/tsl'
import * as React from 'react'
import { extend, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export interface WireframeMaterialProps {
  /** Fill opacity (background), default: 0.25 */
  fillOpacity?: number
  /** Mix factor between material color and fill color, default: 0 */
  fillMix?: number
  /** Stroke (edge) opacity, default: 1 */
  strokeOpacity?: number
  /** Edge thickness 0-1, default: 0.05 */
  thickness?: number
  /** Use different color for backfaces, default: false */
  colorBackfaces?: boolean
  /** Invert dash pattern, default: true */
  dashInvert?: boolean
  /** Enable dashed lines, default: false */
  dash?: boolean
  /** Number of dash repeats, default: 4 */
  dashRepeats?: number
  /** Dash length 0-1, default: 0.5 */
  dashLength?: number
  /** Squeeze thickness toward line center, default: false */
  squeeze?: boolean
  /** Minimum squeeze factor, default: 0.2 */
  squeezeMin?: number
  /** Maximum squeeze factor, default: 1 */
  squeezeMax?: number
  /** Stroke (edge) color */
  stroke?: THREE.ColorRepresentation
  /** Backface stroke color */
  backfaceStroke?: THREE.ColorRepresentation
  /** Fill (background) color */
  fill?: THREE.ColorRepresentation
}

export type WireframeMaterialType = Omit<ThreeElements['meshBasicMaterial'], 'args'> & WireframeMaterialProps

declare module '@react-three/fiber' {
  interface ThreeElements {
    wireframeMaterial: WireframeMaterialType
  }
}

//* TSL Helper Functions ==============================

// Anti-aliased step function using screen-space derivatives
const aastep = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [threshold, dist] = inputs
  const afwidth = fwidth(dist).mul(0.5)
  return smoothstep(threshold.sub(afwidth), threshold.add(afwidth), dist)
})

// Remap value from one range to another
const remap = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [value, min1, max1, min2, max2] = inputs
  return min2.add(value.sub(min1).mul(max2.sub(min2)).div(max1.sub(min1)))
})

//* WireframeMaterial Implementation ==============================

class WireframeMaterialImpl extends MeshBasicNodeMaterial {
  //* Private Uniform Nodes --
  private _strokeOpacity: THREE.UniformNode<number>
  private _fillOpacity: THREE.UniformNode<number>
  private _fillMix: THREE.UniformNode<number>
  private _thickness: THREE.UniformNode<number>
  private _colorBackfaces: THREE.UniformNode<number> // Using number as bool (0/1)
  private _dashInvert: THREE.UniformNode<number>
  private _dash: THREE.UniformNode<number>
  private _dashRepeats: THREE.UniformNode<number>
  private _dashLength: THREE.UniformNode<number>
  private _squeeze: THREE.UniformNode<number>
  private _squeezeMin: THREE.UniformNode<number>
  private _squeezeMax: THREE.UniformNode<number>
  private _stroke: THREE.UniformNode<THREE.Color>
  private _backfaceStroke: THREE.UniformNode<THREE.Color>
  private _fill: THREE.UniformNode<THREE.Color>

  /** Type flag for identification */
  readonly isWireframeMaterial = true

  constructor() {
    super()

    //* Initialize Uniforms --
    this._strokeOpacity = uniform(1.0)
    this._fillOpacity = uniform(0.25)
    this._fillMix = uniform(0.0)
    this._thickness = uniform(0.05)
    this._colorBackfaces = uniform(0.0) // false
    this._dashInvert = uniform(1.0) // true
    this._dash = uniform(0.0) // false
    this._dashRepeats = uniform(4.0)
    this._dashLength = uniform(0.5)
    this._squeeze = uniform(0.0) // false
    this._squeezeMin = uniform(0.2)
    this._squeezeMax = uniform(1.0)
    this._stroke = uniform(new THREE.Color('#ff0000'))
    this._backfaceStroke = uniform(new THREE.Color('#0000ff'))
    this._fill = uniform(new THREE.Color('#00ff00'))

    //* Base Material Properties --
    this.transparent = true
    this.side = THREE.DoubleSide

    this._buildWireframeShader()
  }

  private _buildWireframeShader() {
    //* Capture uniforms for closure --
    const strokeOpacityUniform = this._strokeOpacity
    const fillOpacityUniform = this._fillOpacity
    const thicknessUniform = this._thickness
    const colorBackfacesUniform = this._colorBackfaces
    const dashInvertUniform = this._dashInvert
    const dashUniform = this._dash
    const dashRepeatsUniform = this._dashRepeats
    const dashLengthUniform = this._dashLength
    const squeezeUniform = this._squeeze
    const squeezeMinUniform = this._squeezeMin
    const squeezeMaxUniform = this._squeezeMax
    const strokeUniform = this._stroke
    const backfaceStrokeUniform = this._backfaceStroke
    const fillUniform = this._fill

    //* Varying for barycentric coordinates --
    // Read barycentric attribute and pass to fragment shader
    const barycentricAttr = attribute('barycentric', 'vec3')
    const vBarycentric = varying(barycentricAttr, 'v_barycentric')

    //* Output Node - Wireframe rendering --
    this.outputNode = Fn(() => {
      const barycentric = vBarycentric

      // Distance from center of triangle to its edges
      // The minimum barycentric coordinate gives distance to nearest edge
      const d = min(min(barycentric.x, barycentric.y), barycentric.z)

      // Position along edge for dashing (0-1)
      // Used to create dash patterns along the wireframe edges
      const positionAlong = float(0.0).toVar()
      const maxXY = max(barycentric.x, barycentric.y)

      // Determine which edge we're closest to and compute position along it
      const isYSmallest = barycentric.y.lessThan(barycentric.x).and(barycentric.y.lessThan(barycentric.z))
      positionAlong.assign(select(isYSmallest, float(1.0).sub(maxXY), maxXY))

      // Map thickness from 0-1 to 0-0.34 (practical range for barycentric coords)
      const computedThickness = remap(thicknessUniform, float(0.0), float(1.0), float(0.0), float(0.34)).toVar()

      //* Squeeze effect --
      // Shrink thickness toward center of line segment
      const squeezeEnabled = squeezeUniform.greaterThan(0.5)
      const squeezeFactor = mix(squeezeMinUniform, squeezeMaxUniform, float(1.0).sub(sin(positionAlong.mul(Math.PI))))
      computedThickness.assign(select(squeezeEnabled, computedThickness.mul(squeezeFactor), computedThickness))

      //* Dash pattern --
      const dashEnabled = dashUniform.greaterThan(0.5)
      const dashInverted = dashInvertUniform.greaterThan(0.5)

      // Calculate dash offset based on invert setting
      const baseOffset = float(1.0).div(dashRepeatsUniform).mul(dashLengthUniform).mul(0.5)
      const additionalOffset = float(1.0).div(dashRepeatsUniform).mul(0.5)
      const dashOffset = select(dashInverted, baseOffset, baseOffset.add(additionalOffset))

      // Create repeating dash pattern
      const pattern = fract(positionAlong.add(dashOffset).mul(dashRepeatsUniform))
      const dashMask = float(1.0).sub(aastep(dashLengthUniform, pattern))

      // Apply dash to thickness (when dash is enabled)
      computedThickness.assign(select(dashEnabled, computedThickness.mul(dashMask), computedThickness))

      //* Anti-aliased edge detection --
      // 1 at edges, 0 in center
      const edge = float(1.0).sub(aastep(computedThickness, d))

      //* Color composition --
      // Select stroke color based on front/back face
      const useBackfaceColor = colorBackfacesUniform.greaterThan(0.5)
      const isFrontFace = frontFacing
      const currentStroke = select(useBackfaceColor.and(isFrontFace.not()), backfaceStrokeUniform, strokeUniform)

      // Stroke color with edge-based alpha
      const colorStroke = vec4(currentStroke, edge)

      // Fill color with fill opacity
      const colorFill = vec4(fillUniform, fillOpacityUniform)

      // Mix fill and stroke based on edge and stroke opacity
      const outColor = mix(colorFill, colorStroke, edge.mul(strokeOpacityUniform))

      return outColor
    })()
  }

  //* Uniform Accessors ==============================

  /** Stroke (edge) opacity, default: 1 */
  get strokeOpacity() {
    return this._strokeOpacity.value as number
  }
  set strokeOpacity(v: number) {
    this._strokeOpacity.value = v
  }

  /** Fill opacity (background), default: 0.25 */
  get fillOpacity() {
    return this._fillOpacity.value as number
  }
  set fillOpacity(v: number) {
    this._fillOpacity.value = v
  }

  /** Mix factor between material color and fill color, default: 0 */
  get fillMix() {
    return this._fillMix.value as number
  }
  set fillMix(v: number) {
    this._fillMix.value = v
  }

  /** Edge thickness 0-1, default: 0.05 */
  get thickness() {
    return this._thickness.value as number
  }
  set thickness(v: number) {
    this._thickness.value = v
  }

  /** Use different color for backfaces */
  get colorBackfaces() {
    return this._colorBackfaces.value > 0.5
  }
  set colorBackfaces(v: boolean) {
    this._colorBackfaces.value = v ? 1.0 : 0.0
  }

  /** Invert dash pattern */
  get dashInvert() {
    return this._dashInvert.value > 0.5
  }
  set dashInvert(v: boolean) {
    this._dashInvert.value = v ? 1.0 : 0.0
  }

  /** Enable dashed lines */
  get dash() {
    return this._dash.value > 0.5
  }
  set dash(v: boolean) {
    this._dash.value = v ? 1.0 : 0.0
  }

  /** Number of dash repeats, default: 4 */
  get dashRepeats() {
    return this._dashRepeats.value as number
  }
  set dashRepeats(v: number) {
    this._dashRepeats.value = v
  }

  /** Dash length 0-1, default: 0.5 */
  get dashLength() {
    return this._dashLength.value as number
  }
  set dashLength(v: number) {
    this._dashLength.value = v
  }

  /** Squeeze thickness toward line center */
  get squeeze() {
    return this._squeeze.value > 0.5
  }
  set squeeze(v: boolean) {
    this._squeeze.value = v ? 1.0 : 0.0
  }

  /** Minimum squeeze factor, default: 0.2 */
  get squeezeMin() {
    return this._squeezeMin.value as number
  }
  set squeezeMin(v: number) {
    this._squeezeMin.value = v
  }

  /** Maximum squeeze factor, default: 1 */
  get squeezeMax() {
    return this._squeezeMax.value as number
  }
  set squeezeMax(v: number) {
    this._squeezeMax.value = v
  }

  /** Stroke (edge) color */
  get stroke(): THREE.Color {
    return this._stroke.value as THREE.Color
  }
  set stroke(v: THREE.Color | THREE.ColorRepresentation) {
    if (v instanceof THREE.Color) this._stroke.value = v
    else this._stroke.value = new THREE.Color(v)
  }

  /** Backface stroke color */
  get backfaceStroke(): THREE.Color {
    return this._backfaceStroke.value as THREE.Color
  }
  set backfaceStroke(v: THREE.Color | THREE.ColorRepresentation) {
    if (v instanceof THREE.Color) this._backfaceStroke.value = v
    else this._backfaceStroke.value = new THREE.Color(v)
  }

  /** Fill (background) color */
  get fill(): THREE.Color {
    return this._fill.value as THREE.Color
  }
  set fill(v: THREE.Color | THREE.ColorRepresentation) {
    if (v instanceof THREE.Color) this._fill.value = v
    else this._fill.value = new THREE.Color(v)
  }
}

//* Geometry Helper ==============================

/**
 * Adds barycentric coordinates attribute to a geometry.
 * Required for WireframeMaterial to work.
 *
 * Each vertex in a triangle gets a unique barycentric coordinate:
 * - Vertex 0: (1, 0, 0)
 * - Vertex 1: (0, 1, 0)
 * - Vertex 2: (0, 0, 1)
 *
 * @param geometry - The geometry to add barycentric coordinates to
 * @returns The modified geometry (for chaining)
 */
export function setBarycentricCoordinates(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const position = geometry.getAttribute('position')
  const count = position.count

  // Check if already indexed - we need non-indexed geometry for unique barycentric coords
  if (geometry.index) {
    // Convert to non-indexed
    geometry = geometry.toNonIndexed()
  }

  const barycentricArray = new Float32Array(count * 3)

  // Assign barycentric coordinates to each triangle
  for (let i = 0; i < count; i += 3) {
    // First vertex: (1, 0, 0)
    barycentricArray[i * 3 + 0] = 1
    barycentricArray[i * 3 + 1] = 0
    barycentricArray[i * 3 + 2] = 0

    // Second vertex: (0, 1, 0)
    barycentricArray[(i + 1) * 3 + 0] = 0
    barycentricArray[(i + 1) * 3 + 1] = 1
    barycentricArray[(i + 1) * 3 + 2] = 0

    // Third vertex: (0, 0, 1)
    barycentricArray[(i + 2) * 3 + 0] = 0
    barycentricArray[(i + 2) * 3 + 1] = 0
    barycentricArray[(i + 2) * 3 + 2] = 1
  }

  geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentricArray, 3))

  return geometry
}

//* React Component ==============================

export const WireframeMaterial: ForwardRefComponent<WireframeMaterialProps, WireframeMaterialImpl> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        fillOpacity = 0.25,
        fillMix = 0,
        strokeOpacity = 1,
        thickness = 0.05,
        colorBackfaces = false,
        dashInvert = true,
        dash = false,
        dashRepeats = 4,
        dashLength = 0.5,
        squeeze = false,
        squeezeMin = 0.2,
        squeezeMax = 1,
        stroke = '#ff0000',
        backfaceStroke = '#0000ff',
        fill = '#00ff00',
        ...props
      }: WireframeMaterialProps,
      fref
    ) => {
      extend({ WireframeMaterial: WireframeMaterialImpl })

      const ref = React.useRef<WireframeMaterialImpl>(null!)

      // Forward ref
      React.useImperativeHandle(fref, () => ref.current, [])

      return (
        <wireframeMaterial
          ref={ref as any}
          {...props}
          fillOpacity={fillOpacity}
          fillMix={fillMix}
          strokeOpacity={strokeOpacity}
          thickness={thickness}
          colorBackfaces={colorBackfaces}
          dashInvert={dashInvert}
          dash={dash}
          dashRepeats={dashRepeats}
          dashLength={dashLength}
          squeeze={squeeze}
          squeezeMin={squeezeMin}
          squeezeMax={squeezeMax}
          stroke={stroke instanceof THREE.Color ? stroke : new THREE.Color(stroke)}
          backfaceStroke={backfaceStroke instanceof THREE.Color ? backfaceStroke : new THREE.Color(backfaceStroke)}
          fill={fill instanceof THREE.Color ? fill : new THREE.Color(fill)}
        />
      )
    }
  )

//* Legacy Exports for Compatibility ==============================

/** @deprecated Use WireframeMaterial component instead */
export const WireframeMaterialShaders = {
  uniforms: {
    strokeOpacity: 1,
    fillOpacity: 0.25,
    fillMix: 0,
    thickness: 0.05,
    colorBackfaces: false,
    dashInvert: true,
    dash: false,
    dashRepeats: 4,
    dashLength: 0.5,
    squeeze: false,
    squeezeMin: 0.2,
    squeezeMax: 1,
    stroke: /* @__PURE__ */ new THREE.Color('#ff0000'),
    backfaceStroke: /* @__PURE__ */ new THREE.Color('#0000ff'),
    fill: /* @__PURE__ */ new THREE.Color('#00ff00'),
  },
  vertex: '// Converted to TSL - see WireframeMaterial',
  fragment: '// Converted to TSL - see WireframeMaterial',
}

/** @deprecated Not needed with TSL-based WireframeMaterial */
export function setWireframeOverride(_material: THREE.Material, _uniforms: { [key: string]: THREE.Uniform<any> }) {
  console.warn('setWireframeOverride is deprecated. Use WireframeMaterial directly with TSL for WebGPU.')
}

/** @deprecated Not needed with TSL-based WireframeMaterial */
export function useWireframeUniforms(_uniforms: { [key: string]: THREE.Uniform<any> }, _props: WireframeMaterialProps) {
  console.warn('useWireframeUniforms is deprecated. Use WireframeMaterial props directly with TSL for WebGPU.')
}

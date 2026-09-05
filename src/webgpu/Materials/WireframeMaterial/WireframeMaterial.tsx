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
import { withUniforms } from '@utils/withUniforms'

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

export class WireframeMaterialImpl extends withUniforms(MeshBasicNodeMaterial, {
  /** Stroke (edge) opacity, default: 1 */
  strokeOpacity: () => uniform(1.0),
  /** Fill opacity (background), default: 0.25 */
  fillOpacity: () => uniform(0.25),
  /** Mix factor between material color and fill color, default: 0 */
  fillMix: () => uniform(0.0),
  /** Edge thickness 0-1, default: 0.05 */
  thickness: () => uniform(0.05),
  /** Use different color for backfaces, default: false */
  colorBackfaces: () => uniform(false),
  /** Invert dash pattern, default: true */
  dashInvert: () => uniform(true),
  /** Enable dashed lines, default: false */
  dash: () => uniform(false),
  /** Number of dash repeats, default: 4 */
  dashRepeats: () => uniform(4.0),
  /** Dash length 0-1, default: 0.5 */
  dashLength: () => uniform(0.5),
  /** Squeeze thickness toward line center, default: false */
  squeeze: () => uniform(false),
  /** Minimum squeeze factor, default: 0.2 */
  squeezeMin: () => uniform(0.2),
  /** Maximum squeeze factor, default: 1 */
  squeezeMax: () => uniform(1.0),
  /** Stroke (edge) color */
  stroke: () => uniform(new THREE.Color('#ff0000')),
  /** Backface stroke color */
  backfaceStroke: () => uniform(new THREE.Color('#0000ff')),
  /** Fill (background) color */
  fill: () => uniform(new THREE.Color('#00ff00')),
}) {
  /** Type flag for identification */
  readonly isWireframeMaterial = true

  constructor() {
    super()

    //* Base Material Properties --
    this.transparent = true
    this.side = THREE.DoubleSide

    this._buildWireframeShader()
  }

  private _buildWireframeShader() {
    //* Capture uniforms for closure --
    const {
      strokeOpacity: strokeOpacityUniform,
      fillOpacity: fillOpacityUniform,
      thickness: thicknessUniform,
      colorBackfaces: colorBackfacesUniform,
      dashInvert: dashInvertUniform,
      dash: dashUniform,
      dashRepeats: dashRepeatsUniform,
      dashLength: dashLengthUniform,
      squeeze: squeezeUniform,
      squeezeMin: squeezeMinUniform,
      squeezeMax: squeezeMaxUniform,
      stroke: strokeUniform,
      backfaceStroke: backfaceStrokeUniform,
      fill: fillUniform,
    } = this.uniforms

    //* Varying for barycentric coordinates --
    // Read barycentric attribute and pass to fragment shader
    const barycentricAttr = attribute<'vec3'>('barycentric', 'vec3')
    const vBarycentric = varying<'vec3'>(barycentricAttr, 'v_barycentric')

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
      const squeezeFactor = mix(squeezeMinUniform, squeezeMaxUniform, float(1.0).sub(sin(positionAlong.mul(Math.PI))))
      computedThickness.assign(select(squeezeUniform, computedThickness.mul(squeezeFactor), computedThickness))

      //* Dash pattern --

      // Calculate dash offset based on invert setting
      const baseOffset = float(1.0).div(dashRepeatsUniform).mul(dashLengthUniform).mul(0.5)
      const additionalOffset = float(1.0).div(dashRepeatsUniform).mul(0.5)
      const dashOffset = select(dashInvertUniform, baseOffset, baseOffset.add(additionalOffset))

      // Create repeating dash pattern
      const pattern = fract(positionAlong.add(dashOffset).mul(dashRepeatsUniform))
      const dashMask = float(1.0).sub(aastep(dashLengthUniform, pattern))

      // Apply dash to thickness (when dash is enabled)
      computedThickness.assign(select(dashUniform, computedThickness.mul(dashMask), computedThickness))

      //* Anti-aliased edge detection --
      // 1 at edges, 0 in center
      const edge = float(1.0).sub(aastep(computedThickness, d))

      //* Color composition --
      // Select stroke color based on front/back face
      const isFrontFace = frontFacing
      const currentStroke = select(colorBackfacesUniform.and(isFrontFace.not()), backfaceStrokeUniform, strokeUniform)

      // Stroke color with edge-based alpha
      const colorStroke = vec4(currentStroke, edge)

      // Fill color with fill opacity
      const colorFill = vec4(fillUniform, fillOpacityUniform)

      // Mix fill and stroke based on edge and stroke opacity
      const outColor = mix(colorFill, colorStroke, edge.mul(strokeOpacityUniform))

      return outColor
    })()
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
          stroke={stroke}
          backfaceStroke={backfaceStroke}
          fill={fill}
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

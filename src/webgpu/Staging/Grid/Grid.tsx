//* Grid Component - TSL WebGPU Implementation ==============================
// Infinite grid with configurable cells, sections, and fading
// Based on https://github.com/Fyrestar/THREE.InfiniteGridHelper by Fyrestar
// and https://github.com/threlte/threlte/blob/main/packages/extras/src/lib/components/Grid/Grid.svelte
// by grischaerbe and jerzakm
//
// TSL Conversion: Dennis Smolek

import * as React from 'react'
import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  vec2,
  vec3,
  vec4,
  float,
  positionGeometry,
  modelWorldMatrix,
  varying,
  min,
  abs,
  fract,
  fwidth,
  mix,
  pow,
  distance,
  select,
  Discard,
} from 'three/tsl'
import { extend, ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { withUniforms } from '@utils/withUniforms'

//* Types ==============================

export type GridMaterialType = {
  /** Cell size, default: 0.5 */
  cellSize?: number
  /** Cell thickness, default: 0.5 */
  cellThickness?: number
  /** Cell color, default: black */
  cellColor?: THREE.ColorRepresentation
  /** Section size, default: 1 */
  sectionSize?: number
  /** Section thickness, default: 1 */
  sectionThickness?: number
  /** Section color, default: #2080ff */
  sectionColor?: THREE.ColorRepresentation
  /** Follow camera, default: false */
  followCamera?: boolean
  /** Display the grid infinitely, default: false */
  infiniteGrid?: boolean
  /** Fade distance, default: 100 */
  fadeDistance?: number
  /** Fade strength, default: 1 */
  fadeStrength?: number
  /** Fade from camera (1) or origin (0), or somewhere in between, default: camera */
  fadeFrom?: number
  /** Material side, default: THREE.BackSide */
  side?: THREE.Side
}

export type GridProps = Omit<ThreeElements['mesh'], 'ref' | 'args'> &
  GridMaterialType & {
    /** Default plane-geometry arguments */
    args?: ConstructorParameters<typeof THREE.PlaneGeometry>
  }

//* GridMaterial Implementation ==============================

class GridMaterialImpl extends withUniforms(MeshBasicNodeMaterial, {
  /** Cell size, default: 0.5 */
  cellSize: () => uniform(0.5),
  /** Section size, default: 1 */
  sectionSize: () => uniform(1.0),
  /** Fade distance, default: 100 */
  fadeDistance: () => uniform(100.0),
  /** Fade strength, default: 1 */
  fadeStrength: () => uniform(1.0),
  /** Fade from camera (1) or origin (0), default: 1 */
  fadeFrom: () => uniform(1.0),
  /** Cell thickness, default: 0.5 */
  cellThickness: () => uniform(0.5),
  /** Section thickness, default: 1 */
  sectionThickness: () => uniform(1.0),
  /** Cell color, default: black */
  cellColor: () => uniform(new THREE.Color('#000000')),
  /** Section color, default: #2080ff */
  sectionColor: () => uniform(new THREE.Color('#2080ff')),
  /** Display the grid infinitely */
  infiniteGrid: () => uniform(false),
  /** Follow camera position */
  followCamera: () => uniform(false),
  /** Camera projection position on plane (set by component) */
  worldCamProjPosition: () => uniform(new THREE.Vector3()),
  /** Plane world position (set by component) */
  worldPlanePosition: () => uniform(new THREE.Vector3()),
}) {
  /** Type flag for identification */
  readonly isGridMaterial = true

  constructor() {
    super()

    //* Base Material Properties --
    this.transparent = true
    this.side = THREE.BackSide

    this._buildGridShader()
  }

  private _buildGridShader() {
    //* Capture uniforms for closure --
    const {
      cellSize: cellSizeUniform,
      sectionSize: sectionSizeUniform,
      fadeDistance: fadeDistanceUniform,
      fadeStrength: fadeStrengthUniform,
      fadeFrom: fadeFromUniform,
      cellThickness: cellThicknessUniform,
      sectionThickness: sectionThicknessUniform,
      cellColor: cellColorUniform,
      sectionColor: sectionColorUniform,
      infiniteGrid: infiniteGridUniform,
      followCamera: followCameraUniform,
      worldCamProjPosition: worldCamProjPositionUniform,
      worldPlanePosition: worldPlanePositionUniform,
    } = this.uniforms

    //* Varyings: Pass position data to fragment shader --
    // Compute local and world positions consistently with positionNode

    const computeLocalPosition = Fn(() => {
      const pos = positionGeometry
      // Swizzle xzy: XY plane -> XZ plane (floor)
      let localPos = vec3(pos.x, pos.z, pos.y).toVar()

      // Scale for infinite grid
      const scaleFactor = float(1.0).add(fadeDistanceUniform)
      localPos.assign(select(infiniteGridUniform, localPos.mul(scaleFactor), localPos))

      // Offset for followCamera
      const cameraOffset = worldCamProjPositionUniform.sub(worldPlanePositionUniform)
      localPos.assign(select(followCameraUniform, localPos.add(cameraOffset), localPos))

      return localPos
    })

    const vLocalPosition = varying<'vec3'>(computeLocalPosition(), 'vLocalPosition')

    // World position for fade distance calculation
    const computeWorldPosition = Fn(() => {
      const localPos = computeLocalPosition()
      return modelWorldMatrix.mul(vec4(localPos, 1.0)).xyz
    })

    const vWorldPosition = varying<'vec3'>(computeWorldPosition(), 'vWorldPosition')

    //* Position Node: Returns LOCAL space position --
    // NodeMaterial automatically applies MVP: projectionMatrix * viewMatrix * modelMatrix * positionNode
    this.positionNode = Fn(() => {
      const pos = positionGeometry
      // Swizzle xzy to convert XY plane (default PlaneGeometry) to XZ plane (floor)
      let localPos = vec3(pos.x, pos.z, pos.y).toVar()

      // Scale for infinite grid effect
      const scaleFactor = float(1.0).add(fadeDistanceUniform)
      localPos.assign(select(infiniteGridUniform, localPos.mul(scaleFactor), localPos))

      // For followCamera, offset the local position
      // This approximation works when the grid has no rotation (identity model matrix)
      const cameraOffset = worldCamProjPositionUniform.sub(worldPlanePositionUniform)
      localPos.assign(select(followCameraUniform, localPos.add(cameraOffset), localPos))

      return localPos
    })()

    //* TSL Helper: getGrid function --
    // Calculates grid line intensity at a given position
    const getGrid = Fn((inputs: any[]) => {
      const [localPosition, size, thickness] = inputs

      // Sample coordinates divided by grid size
      const r = vec2(localPosition.x, localPosition.z).div(size)

      // Anti-aliased grid lines using fwidth for screen-space derivatives
      const grid = abs(fract(r.sub(0.5)).sub(0.5)).div(fwidth(r))

      // Line intensity: closer to 0 = on line, higher = off line
      const line = min(grid.x, grid.y).add(float(1.0).sub(thickness))

      // Return inverted and clamped: 1 = on line, 0 = off line
      return float(1.0).sub(min(line, float(1.0)))
    })

    //* Output Node: Fragment shader --
    this.colorNode = Fn(() => {
      const localPosition = vLocalPosition
      const worldPosition = vWorldPosition

      // Calculate cell and section grid intensities
      // getGrid is declared with `any[]` inputs, so its float return is untyped.
      const g1 = getGrid(localPosition, cellSizeUniform, cellThicknessUniform) as unknown as THREE.Node<'float'>
      const g2 = getGrid(localPosition, sectionSizeUniform, sectionThicknessUniform) as unknown as THREE.Node<'float'>

      // Fade calculation based on distance from camera projection
      const from = worldCamProjPositionUniform.mul(fadeFromUniform)
      const dist = distance(from, worldPosition)
      const d = float(1.0).sub(min(dist.div(fadeDistanceUniform), float(1.0)))

      // Mix cell and section colors based on section grid intensity
      const sectionMix = min(float(1.0), sectionThicknessUniform.mul(g2))
      const gridColor = mix(cellColorUniform, sectionColorUniform, sectionMix)

      // Calculate alpha with fade
      const baseAlpha = g1.add(g2).mul(pow(d, fadeStrengthUniform))

      // Reduce alpha slightly where there's no section line (aesthetic choice)
      const finalAlpha = mix(baseAlpha.mul(0.75), baseAlpha, g2)

      // Discard fully transparent pixels
      Discard(finalAlpha.lessThanEqual(0.0))

      return vec4(gridColor, finalAlpha)
    })()
  }
}

//* React Component ==============================

/**
 * Renders an infinite grid with configurable appearance.
 * Supports cell and section lines, fading, and camera following.
 *
 * @example Basic usage
 * ```jsx
 * <Grid infiniteGrid fadeDistance={50} />
 * ```
 *
 * @example With custom colors
 * ```jsx
 * <Grid
 *   cellColor="#444444"
 *   sectionColor="#ff0000"
 *   cellSize={1}
 *   sectionSize={5}
 *   fadeDistance={100}
 *   infiniteGrid
 * />
 * ```
 */
export const Grid: ForwardRefComponent<GridProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  (
    {
      args,
      cellColor = '#000000',
      sectionColor = '#2080ff',
      cellSize = 0.5,
      sectionSize = 1,
      followCamera = false,
      infiniteGrid = false,
      fadeDistance = 100,
      fadeStrength = 1,
      fadeFrom = 1,
      cellThickness = 0.5,
      sectionThickness = 1,
      side = THREE.BackSide,
      ...props
    },
    fRef
  ) => {
    extend({ GridMaterial: GridMaterialImpl })

    const ref = React.useRef<THREE.Mesh>(null!)
    const materialRef = React.useRef<GridMaterialImpl>(null!)

    React.useImperativeHandle(fRef, () => ref.current, [])

    //* Frame Update: Project camera position onto grid plane --
    const plane = React.useMemo(() => new THREE.Plane(), [])
    const upVector = React.useMemo(() => new THREE.Vector3(0, 1, 0), [])
    const zeroVector = React.useMemo(() => new THREE.Vector3(0, 0, 0), [])
    const tempVec = React.useMemo(() => new THREE.Vector3(), [])

    useFrame((state) => {
      if (!materialRef.current) return

      // Set plane from mesh's world transform
      plane.setFromNormalAndCoplanarPoint(upVector, zeroVector).applyMatrix4(ref.current.matrixWorld)

      // Project camera position onto the plane
      plane.projectPoint(state.camera.position, tempVec)
      materialRef.current.worldCamProjPosition.copy(tempVec)

      // Get plane's world position
      tempVec.set(0, 0, 0).applyMatrix4(ref.current.matrixWorld)
      materialRef.current.worldPlanePosition.copy(tempVec)
    })

    return (
      <mesh ref={ref} frustumCulled={false} {...props}>
        <gridMaterial
          ref={materialRef as any}
          side={side}
          cellSize={cellSize}
          sectionSize={sectionSize}
          cellColor={cellColor instanceof THREE.Color ? cellColor : new THREE.Color(cellColor)}
          sectionColor={sectionColor instanceof THREE.Color ? sectionColor : new THREE.Color(sectionColor)}
          cellThickness={cellThickness}
          sectionThickness={sectionThickness}
          fadeDistance={fadeDistance}
          fadeStrength={fadeStrength}
          fadeFrom={fadeFrom}
          infiniteGrid={infiniteGrid}
          followCamera={followCamera}
        />
        <planeGeometry args={args} />
      </mesh>
    )
  }
)

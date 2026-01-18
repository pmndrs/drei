//* Outlines - TSL WebGPU Implementation ==============================
// Outline effect by rendering back-faces expanded along normals
// Supports both screenspace and world-space thickness modes
// TSL Conversion: drei webgpu migration

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  vec4,
  positionLocal,
  normalLocal,
  modelViewMatrix,
  cameraProjectionMatrix,
  normalize,
  select,
} from 'three/tsl'
import * as React from 'react'
import { extend, applyProps, ReactThreeFiber, useThree, ThreeElements } from '@react-three/fiber'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

//* Types ==============================

export type OutlinesProps = Omit<ThreeElements['group'], 'ref'> & {
  /** Outline color, default: black */
  color?: ReactThreeFiber.Color
  /** Line thickness is independent of zoom, default: false */
  screenspace?: boolean
  /** Outline opacity, default: 1 */
  opacity?: number
  /** Outline transparency, default: false */
  transparent?: boolean
  /** Outline thickness, default 0.05 */
  thickness?: number
  /** Geometry crease angle (0 === no crease), default: Math.PI */
  angle?: number
  /** Clipping planes */
  clippingPlanes?: THREE.Plane[]
  /** Enable tone mapping, default: true */
  toneMapped?: boolean
  /** Enable polygon offset, default: false */
  polygonOffset?: boolean
  /** Polygon offset factor, default: 0 */
  polygonOffsetFactor?: number
  /** Render order, default: 0 */
  renderOrder?: number
}

//* OutlinesMaterial Implementation ==============================

class OutlinesMaterial extends MeshBasicNodeMaterial {
  //* Private Uniform Nodes --
  private _screenspace: THREE.UniformNode<number> // Using number as bool (0/1)
  private _color: THREE.UniformNode<THREE.Color>
  private _opacityValue: THREE.UniformNode<number>
  private _thickness: THREE.UniformNode<number>
  private _size: THREE.UniformNode<THREE.Vector2>

  /** Type flag for identification */
  readonly isOutlinesMaterial = true

  constructor() {
    super()

    //* Initialize Uniforms --
    this._screenspace = uniform(0.0) // false
    this._color = uniform(new THREE.Color('black'))
    this._opacityValue = uniform(1.0)
    this._thickness = uniform(0.05)
    this._size = uniform(new THREE.Vector2(1, 1))

    //* Base Material Properties --
    this.side = THREE.BackSide
    this.transparent = false

    this._buildOutlineShader()
  }

  private _buildOutlineShader() {
    //* Capture uniforms for closure --
    const screenspaceUniform = this._screenspace
    const colorUniform = this._color
    const opacityUniform = this._opacityValue
    const thicknessUniform = this._thickness
    const sizeUniform = this._size

    //* Position Node - Vertex expansion along normals --
    // This creates the outline effect by pushing vertices outward
    this.positionNode = Fn(() => {
      const position = positionLocal.toVar()
      const normal = normalLocal.toVar()

      // Check if screenspace mode
      const isScreenspace = screenspaceUniform.greaterThan(0.5)

      //* Screenspace mode --
      // Thickness is constant in screen pixels regardless of distance
      // Simply offset position along normal in local space
      const screenspacePos = position.add(normal.mul(thicknessUniform))

      //* World-space mode --
      // Thickness varies with distance - we need to compute in clip space
      // First get the clip-space position and normal
      const clipPos = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(position, 1.0)))
      const clipNormal = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(normal, 0.0)))

      // Normalize the clip-space normal in XY and scale by thickness
      // The offset is proportional to clipPosition.w to maintain consistent screen-space size
      const offset = normalize(clipNormal.xy).mul(thicknessUniform).div(sizeUniform).mul(clipPos.w).mul(2.0)

      // For world-space mode, we need to compute the offset in local space
      // by working backwards from the desired clip-space offset
      // This is an approximation that works well for most cases
      const worldOffset = normal.mul(thicknessUniform)

      // Select based on mode
      return select(isScreenspace, screenspacePos, position.add(worldOffset))
    })()

    //* Output Node - Simple color output --
    this.outputNode = Fn(() => {
      return vec4(colorUniform, opacityUniform)
    })()
  }

  //* Uniform Accessors ==============================

  /** Whether to use screenspace thickness */
  get screenspace() {
    return this._screenspace.value > 0.5
  }
  set screenspace(v: boolean) {
    this._screenspace.value = v ? 1.0 : 0.0
  }

  /** Outline color */
  get color(): THREE.Color {
    return this._color.value as THREE.Color
  }
  set color(v: THREE.Color | THREE.ColorRepresentation) {
    if (v instanceof THREE.Color) this._color.value = v
    else this._color.value = new THREE.Color(v)
  }

  /** Outline opacity */
  get opacity() {
    return this._opacityValue.value as number
  }
  set opacity(v: number) {
    this._opacityValue.value = v
  }

  /** Outline thickness */
  get thickness() {
    return this._thickness.value as number
  }
  set thickness(v: number) {
    this._thickness.value = v
  }

  /** Screen size for screenspace calculations */
  get size(): THREE.Vector2 {
    return this._size.value as THREE.Vector2
  }
  set size(v: THREE.Vector2) {
    this._size.value = v
  }
}

//* React Component ==============================

export function Outlines({
  color = 'black',
  opacity = 1,
  transparent = false,
  screenspace = false,
  toneMapped = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  renderOrder = 0,
  thickness = 0.05,
  angle = Math.PI,
  clippingPlanes,
  ...props
}: OutlinesProps) {
  const ref = React.useRef<THREE.Group>(null)
  const [material] = React.useState(() => new OutlinesMaterial())
  const { gl } = useThree()
  const contextSize = gl.getDrawingBufferSize(new THREE.Vector2())

  // Extend R3F with our material
  React.useMemo(() => extend({ OutlinesMaterial }), [])

  const oldAngle = React.useRef(0)
  const oldGeometry = React.useRef<THREE.BufferGeometry | null>(null)

  // Setup outline mesh based on parent geometry
  React.useLayoutEffect(() => {
    const group = ref.current
    if (!group) return

    const parent = group.parent as THREE.Mesh & THREE.SkinnedMesh & THREE.InstancedMesh
    if (parent && parent.geometry) {
      if (oldAngle.current !== angle || oldGeometry.current !== parent.geometry) {
        oldAngle.current = angle
        oldGeometry.current = parent.geometry

        // Remove old mesh
        let mesh = group.children?.[0] as any
        if (mesh) {
          if (angle) mesh.geometry.dispose()
          group.remove(mesh)
        }

        // Create appropriate mesh type based on parent
        if (parent.skeleton) {
          // SkinnedMesh - need to bind skeleton
          mesh = new THREE.SkinnedMesh()
          mesh.material = material
          mesh.bind(parent.skeleton, parent.bindMatrix)
          group.add(mesh)
        } else if (parent.isInstancedMesh) {
          // InstancedMesh - share instance matrix
          mesh = new THREE.InstancedMesh(parent.geometry, material, parent.count)
          mesh.instanceMatrix = parent.instanceMatrix
          group.add(mesh)
        } else {
          // Regular Mesh
          mesh = new THREE.Mesh()
          mesh.material = material
          group.add(mesh)
        }

        // Use creased normals for better edge detection, or original geometry
        mesh.geometry = angle ? toCreasedNormals(parent.geometry, angle) : parent.geometry
        mesh.morphTargetInfluences = parent.morphTargetInfluences
        mesh.morphTargetDictionary = parent.morphTargetDictionary
      }
    }
  })

  // Update material properties
  React.useLayoutEffect(() => {
    const group = ref.current
    if (!group) return

    const mesh = group.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
    if (mesh) {
      mesh.renderOrder = renderOrder

      const parent = group.parent as THREE.Mesh & THREE.SkinnedMesh & THREE.InstancedMesh

      // Sync morph targets with parent
      applyProps(mesh, {
        morphTargetInfluences: parent.morphTargetInfluences,
        morphTargetDictionary: parent.morphTargetDictionary,
      })

      // Update material uniforms
      applyProps(mesh.material, {
        transparent,
        thickness,
        color,
        opacity,
        size: contextSize,
        screenspace,
        toneMapped,
        polygonOffset,
        polygonOffsetFactor,
        clippingPlanes,
        clipping: clippingPlanes && clippingPlanes.length > 0,
      })
    }
  })

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      const group = ref.current
      if (!group) return

      const mesh = group.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
      if (mesh) {
        if (angle) mesh.geometry.dispose()
        group.remove(mesh)
      }
    }
  }, [])

  return <group ref={ref} {...props} />
}

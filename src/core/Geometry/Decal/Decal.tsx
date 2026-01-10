import * as React from 'react'
import * as THREE from '#three'
import * as FIBER from '@react-three/fiber'
import { applyProps } from '@react-three/fiber'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type DecalProps = Omit<FIBER.ThreeElements['mesh'], 'ref' | 'children'> & {
  /** Shows a wireframe bounding box helper for positioning, default: false */
  debug?: boolean
  /** External mesh to project the decal onto (uses parent mesh if not specified) */
  mesh?: React.RefObject<THREE.Mesh>
  /** Position of the decal on the surface */
  position?: FIBER.Vector3
  /** Euler for manual orientation, or a single float (radians) for spin around the surface normal */
  rotation?: FIBER.Euler | number
  /** Scale of the decal */
  scale?: FIBER.Vector3
  /** Texture map for the decal */
  map?: THREE.Texture
  /** Custom material as children */
  children?: React.ReactNode
  /** Polygon offset factor to prevent z-fighting, default: -10 */
  polygonOffsetFactor?: number
  /** Whether to use depth testing, default: false */
  depthTest?: boolean
}

function vecToArray(vec: number[] | FIBER.Vector3 | FIBER.Euler | number = [0, 0, 0]): number[] {
  if (Array.isArray(vec)) return vec as number[]
  if (typeof vec === 'number') return [vec, vec, vec]
  return [(vec as THREE.Vector3).x, (vec as THREE.Vector3).y, (vec as THREE.Vector3).z]
}

/**
 * Abstraction around THREE's `DecalGeometry`. It will use its parent mesh as the decal surface by default.
 * The decal box has to intersect the surface, otherwise it will not be visible.
 * If you do not specify a rotation it will look at the parent's center point.
 * You can also pass a single number as the rotation which allows you to spin it.
 *
 * @example Basic usage
 * ```jsx
 * <mesh>
 *   <sphereGeometry />
 *   <meshBasicMaterial />
 *   <Decal
 *     debug // Makes "bounding box" of the decal visible
 *     position={[0, 0, 0]}
 *     rotation={[0, 0, 0]} // Can be a vector or a single radian for spin
 *     scale={1}
 *   >
 *     <meshBasicMaterial map={texture} polygonOffset polygonOffsetFactor={-1} />
 *   </Decal>
 * </mesh>
 * ```
 *
 * @example With just a map (auto-creates transparent material)
 * ```jsx
 * <mesh>
 *   <sphereGeometry />
 *   <meshBasicMaterial />
 *   <Decal map={texture} />
 * </mesh>
 * ```
 *
 * @example Attach to external mesh
 * ```jsx
 * <Decal mesh={meshRef}>
 *   <meshBasicMaterial map={texture} polygonOffset polygonOffsetFactor={-1} />
 * </Decal>
 * ```
 */
export const Decal: ForwardRefComponent<DecalProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef<
  THREE.Mesh,
  DecalProps
>(function Decal(
  { debug, depthTest = false, polygonOffsetFactor = -10, map, mesh, children, position, rotation, scale, ...props },
  forwardRef
) {
  const ref = React.useRef<THREE.Mesh>(null!)
  React.useImperativeHandle(forwardRef, () => ref.current)
  const helper = React.useRef<THREE.Mesh>(null!)
  const state = React.useRef({
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
  })

  React.useLayoutEffect(() => {
    const parent = mesh?.current || ref.current.parent
    const target = ref.current
    if (!(parent instanceof THREE.Mesh)) {
      throw new Error('Decal must have a Mesh as parent or specify its "mesh" prop')
    }

    if (parent) {
      applyProps(state.current, { position, scale })

      // Zero out the parents matrix world for this operation
      const matrixWorld = parent.matrixWorld.clone()
      parent.matrixWorld.identity()

      if (!rotation || typeof rotation === 'number') {
        const o = new THREE.Object3D()
        o.position.copy(state.current.position)

        // Thanks https://x.com/N8Programs !
        const vertices = parent.geometry.attributes.position.array
        if (parent.geometry.attributes.normal === undefined) parent.geometry.computeVertexNormals()
        const normal = parent.geometry.attributes.normal.array
        let distance = Infinity
        let closestNormal = new THREE.Vector3()
        const ox = o.position.x
        const oy = o.position.y
        const oz = o.position.z
        const vLength = vertices.length
        let chosenIdx = -1
        for (let i = 0; i < vLength; i += 3) {
          const x = vertices[i]
          const y = vertices[i + 1]
          const z = vertices[i + 2]
          const xDiff = x - ox
          const yDiff = y - oy
          const zDiff = z - oz
          const distSquared = xDiff * xDiff + yDiff * yDiff + zDiff * zDiff
          if (distSquared < distance) {
            distance = distSquared
            chosenIdx = i
          }
        }
        closestNormal.fromArray(normal, chosenIdx)

        // Get vector tangent to normal
        o.lookAt(o.position.clone().add(closestNormal))
        o.rotateZ(Math.PI)
        o.rotateY(Math.PI)

        if (typeof rotation === 'number') o.rotateZ(rotation)
        applyProps(state.current, { rotation: o.rotation })
      } else {
        applyProps(state.current, { rotation })
      }

      if (helper.current) {
        applyProps(helper.current, state.current)
      }

      target.geometry = new DecalGeometry(parent, state.current.position, state.current.rotation, state.current.scale)
      // Reset parents matix-world
      parent.matrixWorld = matrixWorld

      return () => {
        target.geometry.dispose()
      }
    }
  }, [mesh, ...vecToArray(position), ...vecToArray(scale), ...vecToArray(rotation)])

  React.useLayoutEffect(() => {
    if (helper.current) {
      // Prevent the helpers from blocking rays
      helper.current.traverse((child) => (child.raycast = () => null))
    }
  }, [debug])

  return (
    <mesh
      ref={ref}
      material-transparent
      material-polygonOffset
      material-polygonOffsetFactor={polygonOffsetFactor}
      material-depthTest={depthTest}
      material-map={map}
      {...props}
    >
      {children}
      {debug && (
        <mesh ref={helper}>
          <boxGeometry />
          <meshNormalMaterial wireframe />
          <axesHelper />
        </mesh>
      )}
    </mesh>
  )
})

import { ThreeElements } from '@react-three/fiber'
import * as React from 'react'
import { BufferAttribute, BufferGeometry } from '#three'

export type ComputedAttributeProps = Omit<ThreeElements['bufferAttribute'], 'args'> & {
  compute: (geometry: BufferGeometry) => BufferAttribute
  name: string
}

/**
 * Create and attach a buffer attribute declaratively.
 * Used exclusively as a child of a BufferGeometry.
 *
 * @example Basic usage
 * ```jsx
 * <sphereGeometry>
 *   <ComputedAttribute
 *     name="my-attribute-name"
 *     compute={(geometry) => {
 *       // ...someLogic
 *       return new THREE.BufferAttribute([1, 2, 3], 1)
 *     }}
 *     usage={THREE.StaticReadUsage}
 *   />
 * </sphereGeometry>
 * ```
 */
export const ComputedAttribute = ({ compute, name, ...props }: ComputedAttributeProps) => {
  const [bufferAttribute] = React.useState(() => new BufferAttribute(new Float32Array(0), 1))
  const primitive = React.useRef<BufferAttribute>(null)

  React.useLayoutEffect(() => {
    if (primitive.current) {
      const prim = primitive.current as any
      const parent = (prim.parent as BufferGeometry) ?? prim.__r3f?.parent?.object

      const attr = compute(parent)
      primitive.current.copy(attr)
    }
  }, [compute])

  return <primitive ref={primitive} object={bufferAttribute} attach={`attributes-${name}`} {...props} />
}

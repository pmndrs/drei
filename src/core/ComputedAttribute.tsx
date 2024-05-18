import { type ThreeElements, type Instance, useInstanceHandle } from '@react-three/fiber'
import * as React from 'react'
import { type BufferGeometry, BufferAttribute } from 'three'

export interface ComputeAttributeProps extends Partial<ThreeElements['bufferAttribute']> {
  compute: (geometry: BufferGeometry) => BufferAttribute
  name: string
}

/**
 * Used exclusively as a child of a BufferGeometry.
 * Computes the BufferAttribute by calling the `compute` function
 * and attaches the attribute to the geometry.
 */
export const ComputedAttribute = ({ compute, name, ...props }: React.PropsWithChildren<ComputeAttributeProps>) => {
  const [bufferAttribute] = React.useState(() => new BufferAttribute(new Float32Array(0), 1))
  const primitive = React.useRef<BufferAttribute>(null!)

  const instance = useInstanceHandle(primitive)

  React.useLayoutEffect(() => {
    if (instance.current) {
      const parent: Instance<BufferGeometry> | null = instance.current.parent
      if (parent) {
        const attr = compute(parent.object)
        primitive.current.copy(attr)
      }
    }
  }, [compute])

  return <primitive ref={primitive} object={bufferAttribute} attach={`attributes-${name}`} {...props} />
}

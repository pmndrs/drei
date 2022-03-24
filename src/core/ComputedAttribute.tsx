import * as React from 'react'
import { BufferAttribute, BufferGeometry } from 'three'

type Props = {
  compute: (geometry: BufferGeometry) => BufferAttribute
  name: string
}

/**
 * Used exclusively as a child of a BufferGeometry.
 * Computes the BufferAttribute by calling the `compute` function
 * and attaches the attribute to the geometry.
 */
export const ComputedAttribute: React.FC<Props> = ({ compute, name, ...props }) => {
  const [bufferAttribute] = React.useState(() => new BufferAttribute(new Float32Array(0), 1))
  const primitive = React.useRef<BufferAttribute>(null)

  React.useLayoutEffect(() => {
    if (primitive.current) {
      // @ts-expect-error brittle
      const parent = (primitive.current.parent as BufferGeometry) ?? primitive.current.__r3f.parent

      const attr = compute(parent)
      primitive.current.copy(attr)
    }
  }, [compute])

  return <primitive ref={primitive} object={bufferAttribute} attachObject={['attributes', name]} {...props} />
}

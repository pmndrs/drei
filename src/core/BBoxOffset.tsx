import * as React from 'react'
import { Box3, Vector3, Object3D } from 'three'
import { useFrame, GroupProps } from '@react-three/fiber'

export interface BBOffsetProps extends GroupProps {
  anchor: Vector3 | [number, number, number]
}

export const BBoxOffset = ({ anchor, ...props }: BBOffsetProps) => {
  const ref = React.useRef<Object3D>(null!)
  const [parentRef, setParentRef] = React.useState<Object3D | null>(null)

  // Reattach group created by this component to the parent's parent,
  // so it becomes a sibling of its initial parent.
  // We do that so the children have no impact on a bounding box of a parent.
  React.useEffect(() => {
    if (ref.current?.parent?.parent) {
      setParentRef(ref.current.parent)
      ref.current.parent.parent.add(ref.current)
    }
  }, [])

  // Do not create objects in loop.
  // https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls#don't-re-create-objects-in-loops
  const boundingBox = new Box3()
  const boundingBoxSize = new Vector3()

  useFrame(() => {
    if (parentRef) {
      boundingBox.setFromObject(parentRef)
      boundingBox.getSize(boundingBoxSize)

      ref.current.position.set(
        boundingBoxSize.x * anchor[0],
        boundingBoxSize.y * anchor[1],
        boundingBoxSize.z * anchor[2]
      )
    }
  })

  return <group ref={ref} {...props} />
}

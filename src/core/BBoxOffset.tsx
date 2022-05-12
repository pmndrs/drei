import * as React from 'react'
import { Group, Box3, Vector3 } from 'three'
import { useFrame, GroupProps } from '@react-three/fiber'

export interface BBOffsetProps extends GroupProps {
  anchor: Vector3 | [number, number, number]
}

export const BBoxOffset = ({ anchor, ...props }: BBOffsetProps) => {
  const group = React.useRef<Group>(null!)

  useFrame(() => {
    if (!group.current || !group.current.parent) {
      return
    }

    const bbox = new Box3().setFromObject(group.current.parent)
    const bboxSize = new Vector3()
    bbox.getSize(bboxSize)

    group.current.position.set(bboxSize.x * anchor[0], bboxSize.y * anchor[1], bboxSize.z * anchor[2])
  })

  return <group {...props} ref={group} />
}

import { Box3, Vector3, Sphere, Group } from 'three'
import * as React from 'react'

type Props = JSX.IntrinsicElements['group'] & {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
}

export const Center = React.forwardRef<Group, Props>(function Center(
  { children, left, right, top, bottom, ...props },
  fRef
) {
  const outer = React.useRef<Group>(null!)
  const inner = React.useRef<Group>(null!)
  React.useLayoutEffect(() => {
    outer.current.matrixWorld.identity()
    const box3 = new Box3().setFromObject(inner.current)
    const center = new Vector3()
    const sphere = new Sphere()
    const height = box3.max.y - box3.min.y
    const width = box3.max.x - box3.min.x
    box3.getCenter(center)
    box3.getBoundingSphere(sphere)
    const vAlign = top ? height / 2 : bottom ? -height / 2 : 0
    const hAlign = left ? -width / 2 : right ? width / 2 : 0
    outer.current.position.set(-center.x + hAlign, -center.y + vAlign, -center.z)
  }, [children])
  return (
    <group ref={fRef} {...props}>
      <group ref={outer}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  )
})

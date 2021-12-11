import { Box3, Vector3, Sphere, Group } from 'three'
import * as React from 'react'

type Props = JSX.IntrinsicElements['group'] & {
  alignTop?: boolean
}

export const Center = React.forwardRef<Group, Props>(function Center({ children, alignTop, ...props }, ref) {
  const outer = React.useRef<Group>(null!)
  const inner = React.useRef<Group>(null!)
  React.useLayoutEffect(() => {
    outer.current.position.set(0, 0, 0)
    outer.current.updateWorldMatrix(true, true)
    const box3 = new Box3().setFromObject(inner.current)
    const center = new Vector3()
    const sphere = new Sphere()
    const height = box3.max.y - box3.min.y
    box3.getCenter(center)
    box3.getBoundingSphere(sphere)
    outer.current.position.set(-center.x, -center.y + (alignTop ? height / 2 : 0), -center.z)
  }, [children])
  return (
    <group ref={ref} {...props}>
      <group ref={outer}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  )
})

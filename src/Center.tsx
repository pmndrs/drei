import { Box3, Vector3, Group } from 'three'
import * as React from 'react'

export const Center = React.forwardRef(function Center({ children, ...props }: JSX.IntrinsicElements['group'], ref) {
  const outer = React.useRef<Group>()
  const inner = React.useRef<Group>()
  React.useLayoutEffect(() => {
    if (inner.current && outer.current) {
      const box = new Box3()
      box.setFromObject(inner.current)
      const center = new Vector3()
      box.getSize(center)
      outer.current.position.set(-center.x / 2, -center.y / 2, -center.z / 2)
    }
  }, [children])
  return (
    <group ref={ref as any} {...props}>
      <group ref={outer}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  )
})

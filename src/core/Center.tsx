import { Box3, Vector3, Sphere, Group } from 'three'
import * as React from 'react'

export type OnCenterCallbackProps = {
  /** The next parent above <Center> */
  parent: THREE.Object3D
  /** The outmost container group of the <Center> component */
  container: THREE.Object3D
  width: number
  height: number
  depth: number
  boundingBox: THREE.Box3
  boundingSphere: THREE.Sphere
  center: THREE.Vector3
  verticalAlignment: number
  horizontalAlignment: number
  depthAlignment: number
}

export type CenterProps = {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
  front?: boolean
  back?: boolean
  /** Disable all axes */
  disable?: boolean
  /** Disable x-axis centering */
  disableX?: boolean
  /** Disable y-axis centering */
  disableY?: boolean
  /** Disable z-axis centering */
  disableZ?: boolean
  /** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
  precise?: boolean
  /** Callback, fires in the useLayoutEffect phase, after measurement */
  onCentered?: (props: OnCenterCallbackProps) => void
}

export const Center = React.forwardRef<Group, JSX.IntrinsicElements['group'] & CenterProps>(function Center(
  {
    children,
    disable,
    disableX,
    disableY,
    disableZ,
    left,
    right,
    top,
    bottom,
    front,
    back,
    onCentered,
    precise = true,
    ...props
  },
  fRef
) {
  const ref = React.useRef<Group>(null!)
  const outer = React.useRef<Group>(null!)
  const inner = React.useRef<Group>(null!)
  React.useLayoutEffect(() => {
    outer.current.matrixWorld.identity()
    const box3 = new Box3().setFromObject(inner.current, precise)
    const center = new Vector3()
    const sphere = new Sphere()
    const width = box3.max.x - box3.min.x
    const height = box3.max.y - box3.min.y
    const depth = box3.max.z - box3.min.z
    box3.getCenter(center)
    box3.getBoundingSphere(sphere)
    const vAlign = top ? height / 2 : bottom ? -height / 2 : 0
    const hAlign = left ? -width / 2 : right ? width / 2 : 0
    const dAlign = front ? depth / 2 : back ? -depth / 2 : 0

    outer.current.position.set(
      disable || disableX ? 0 : -center.x + hAlign,
      disable || disableY ? 0 : -center.y + vAlign,
      disable || disableZ ? 0 : -center.z + dAlign
    )

    if (typeof onCentered !== 'undefined') {
      onCentered({
        parent: ref.current.parent!,
        container: ref.current,
        width,
        height,
        depth,
        boundingBox: box3,
        boundingSphere: sphere,
        center: center,
        verticalAlignment: vAlign,
        horizontalAlignment: hAlign,
        depthAlignment: dAlign,
      })
    }
  }, [children])

  React.useImperativeHandle(fRef, () => ref.current, [])

  return (
    <group ref={ref} {...props}>
      <group ref={outer}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  )
})

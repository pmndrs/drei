import * as React from 'react'
import { Group, Quaternion } from '#three'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type BillboardProps = Omit<ThreeElements['group'], 'ref'> & {
  /** Whether the billboard actively tracks the camera. Set to false to freeze the current orientation. @default true */
  follow?: boolean
  /** Lock rotation on the X axis, preventing vertical tilting. @default false */
  lockX?: boolean
  /** Lock rotation on the Y axis, preventing horizontal rotation. @default false */
  lockY?: boolean
  /** Lock rotation on the Z axis, preventing roll. @default false */
  lockZ?: boolean
}

/**
 * Wraps children in a group that always faces the camera (billboarding).
 * Useful for labels, sprites, health bars, or any UI element that should always face the viewer.
 *
 * @example Basic usage
 * ```jsx
 * <Billboard>
 *   <Text>I'm a billboard</Text>
 * </Billboard>
 * ```
 *
 * @example Lock specific axes
 * ```jsx
 * <Billboard follow={true} lockY={true}>
 *   <Plane args={[3, 2]} material-color="red" />
 * </Billboard>
 * ```
 *
 * @example Inside a group (inherits parent transforms)
 * ```jsx
 * <group position={[5, 0, 0]}>
 *   <Billboard>
 *     <Text>Label</Text>
 *   </Billboard>
 *   <Box />
 * </group>
 * ```
 */
export const Billboard: ForwardRefComponent<BillboardProps, Group> = /* @__PURE__ */ React.forwardRef<
  Group,
  BillboardProps
>(function Billboard({ children, follow = true, lockX = false, lockY = false, lockZ = false, ...props }, fref) {
  const inner = React.useRef<Group>(null!)
  const localRef = React.useRef<Group>(null!)
  const q = new Quaternion()

  useFrame(({ camera }) => {
    if (!follow || !localRef.current) return

    // save previous rotation in case we're locking an axis
    const prevRotation = inner.current.rotation.clone()

    // always face the camera
    localRef.current.updateMatrix()
    localRef.current.updateWorldMatrix(false, false)
    localRef.current.getWorldQuaternion(q)
    camera.getWorldQuaternion(inner.current.quaternion).premultiply(q.invert())

    // readjust any axis that is locked
    if (lockX) inner.current.rotation.x = prevRotation.x
    if (lockY) inner.current.rotation.y = prevRotation.y
    if (lockZ) inner.current.rotation.z = prevRotation.z
  })

  React.useImperativeHandle(fref, () => localRef.current, [])
  return (
    <group ref={localRef} {...props}>
      <group ref={inner}>{children}</group>
    </group>
  )
})

import * as React from 'react'
import { Group } from 'three'
import { useFrame } from '@react-three/fiber'

export type BillboardProps = {
  follow?: boolean
  lockX?: boolean
  lockY?: boolean
  lockZ?: boolean
} & JSX.IntrinsicElements['group']

/**
 * Wraps children in a billboarded group. Sample usage:
 *
 * ```js
 * <Billboard>
 *   <Text>hi</Text>
 * </Billboard>
 * ```
 */
export const Billboard = React.forwardRef<Group, BillboardProps>(function Billboard(
  { follow = true, lockX = false, lockY = false, lockZ = false, ...props },
  ref
) {
  const billboard = React.useRef<Group>(null!)
  React.useImperativeHandle(ref, () => billboard.current)
  useFrame(({ camera }) => {
    if (!follow) return

    // save previous rotation in case we're locking an axis
    const prevRotation = billboard.current.rotation.clone()

    // always face the camera
    billboard.current.quaternion.copy(camera.quaternion)

    // readjust any axis that is locked
    if (lockX) billboard.current.rotation.x = prevRotation.x
    if (lockY) billboard.current.rotation.y = prevRotation.y
    if (lockZ) billboard.current.rotation.z = prevRotation.z
  })
  return <group ref={billboard} {...props} />
})

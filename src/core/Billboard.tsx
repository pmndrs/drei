import * as React from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

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
export const Billboard = React.forwardRef(function Billboard(
  { follow = true, lockX = false, lockY = false, lockZ = false, ...props }: BillboardProps,
  ref
) {
  const localRef = React.useRef<Mesh>()
  useFrame(({ camera }) => {
    if (!follow || !localRef.current) return

    // save previous rotation in case we're locking an axis
    const prevRotation = localRef.current.rotation.clone()

    // always face the camera
    localRef.current.quaternion.copy(camera.quaternion)

    // readjust any axis that is locked
    if (lockX) localRef.current.rotation.x = prevRotation.x
    if (lockY) localRef.current.rotation.y = prevRotation.y
    if (lockZ) localRef.current.rotation.z = prevRotation.z
  })
  return <group ref={mergeRefs([localRef, ref])} {...props} />
})

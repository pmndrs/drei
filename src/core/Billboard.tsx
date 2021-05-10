import * as React from 'react'
import { Mesh, Vector3 } from 'three'
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
    const prevRotation = localRef.current.rotation.clone()
    const prevPosition = localRef.current.position.clone()

    // position in front of camera even if camera pans
    // we translate there so our rotation always is facing forward
    const cameraFront = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position)
    localRef.current.position.copy(cameraFront)
    localRef.current.lookAt(camera.position)
    localRef.current.position.copy(prevPosition)

    // readjust any axis that is locked
    if (lockX) localRef.current.rotation.x = prevRotation.x
    if (lockY) localRef.current.rotation.y = prevRotation.y
    if (lockZ) localRef.current.rotation.z = prevRotation.z
  })
  return <group ref={mergeRefs([localRef, ref])} {...props} />
})

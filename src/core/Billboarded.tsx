import * as React from 'react'
import { Object3D } from 'three'
import { useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

export type BillboardedProps = {
  follow?: boolean
  lockX?: boolean
  lockY?: boolean
  lockZ?: boolean
  children: React.ReactElement<Object3D>
}

/**
 * Wrap a single child to make it into a billboard. e.g.
 *
 * ```js
 * <Billboarded>
 *   <Text ...>hi</Text>
 * </Billboarded>
 * ```
 */
export const Billboarded = React.forwardRef(function Billboarded(
  { follow = true, lockX = false, lockY = false, lockZ = false, children }: BillboardedProps,
  ref
) {
  const child = React.Children.only(children)
  const localRef = React.useRef<Object3D>()
  useFrame(({ camera }) => {
    if (!follow) return
    if (localRef.current) {
      const prev = {
        x: localRef.current.rotation.x,
        y: localRef.current.rotation.y,
        z: localRef.current.rotation.z,
      }
      localRef.current.lookAt(camera.position)
      // readjust any axis that is locked
      if (lockX) localRef.current.rotation.x = prev.x
      if (lockY) localRef.current.rotation.y = prev.y
      if (lockZ) localRef.current.rotation.z = prev.z
    }
  })
  return React.cloneElement<Object3D & React.RefAttributes<unknown>>(child, { ref: mergeRefs([localRef, ref]) })
})

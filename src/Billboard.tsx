import React, { forwardRef, useRef } from 'react'
import { Mesh, PlaneBufferGeometry } from 'three'
import { useFrame } from 'react-three-fiber'
import { Plane, ShapeProps } from './shapes'
import mergeRefs from 'react-merge-refs'

export type BillboardProps = {
  follow?: boolean
  lockX?: boolean
  lockY?: boolean
  lockZ?: boolean
} & ShapeProps<typeof PlaneBufferGeometry>

export const Billboard = forwardRef(function Billboard(
  { follow = true, lockX = false, lockY = false, lockZ = false, ...props }: BillboardProps,
  ref
) {
  const localRef = useRef<Mesh>()
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
  return <Plane ref={mergeRefs([localRef, ref])} {...props} />
})

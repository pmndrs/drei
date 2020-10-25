import React, { forwardRef, useEffect } from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three/examples/jsm/controls/DeviceOrientationControls'
import useEffectfulState from './helpers/useEffectfulState'

export type DeviceOrientationControls = Overwrite<
  ReactThreeFiber.Object3DNode<DeviceOrientationControlsImp, typeof DeviceOrientationControlsImp>,
  { target?: ReactThreeFiber.Vector3 }
>

export const DeviceOrientationControls = forwardRef((props: DeviceOrientationControls, ref) => {
  const { camera, invalidate } = useThree()
  const controls = useEffectfulState(() => new DeviceOrientationControlsImp(camera), [camera], ref as any)

  useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  useFrame(() => controls?.update())

  useEffect(() => {
    const current = controls
    current?.connect()
    return () => current?.dispose()
  }, [controls])

  return controls ? <primitive dispose={undefined} object={controls} {...props} /> : null
})

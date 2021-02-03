import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from 'react-three-fiber'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three/examples/jsm/controls/DeviceOrientationControls'
import useEffectfulState from '../helpers/useEffectfulState'

export type DeviceOrientationControls = ReactThreeFiber.Object3DNode<
  DeviceOrientationControlsImp,
  typeof DeviceOrientationControlsImp
>

export const DeviceOrientationControls = React.forwardRef((props: DeviceOrientationControls, ref) => {
  const { camera, invalidate } = useThree()
  const controls = useEffectfulState(() => new DeviceOrientationControlsImp(camera), [camera], ref as any)

  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  useFrame(() => controls?.update())

  React.useEffect(() => {
    const current = controls
    current?.connect()
    return () => current?.dispose()
  }, [controls])

  return controls ? <primitive dispose={undefined} object={controls} {...props} /> : null
})

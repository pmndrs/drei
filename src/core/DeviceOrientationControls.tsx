import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from 'react-three-fiber'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'

export type DeviceOrientationControls = ReactThreeFiber.Object3DNode<
  DeviceOrientationControlsImp,
  typeof DeviceOrientationControlsImp
> & {
  camera?: THREE.Camera
}

export const DeviceOrientationControls = React.forwardRef((props: DeviceOrientationControls, ref) => {
  const { camera, ...rest } = props
  const { camera: defaultCamera, invalidate } = useThree(({ camera, invalidate }) => ({ camera, invalidate }))
  const explCamera = camera || defaultCamera
  const [controls] = React.useState(() => new DeviceOrientationControlsImp(explCamera))

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

  return controls ? <primitive ref={ref} dispose={undefined} object={controls} {...rest} /> : null
})

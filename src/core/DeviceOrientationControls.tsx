import { ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'

export type DeviceOrientationControlsProps = ReactThreeFiber.Object3DNode<
  DeviceOrientationControlsImp,
  typeof DeviceOrientationControlsImp
> & {
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
}

export const DeviceOrientationControls = React.forwardRef<DeviceOrientationControlsImp, DeviceOrientationControlsProps>(
  (props: DeviceOrientationControlsProps, ref) => {
    const { camera, onChange, ...rest } = props
    const defaultCamera = useThree((state) => state.camera)
    const invalidate = useThree((state) => state.invalidate)
    const explCamera = camera || defaultCamera
    const [controls] = React.useState(() => new DeviceOrientationControlsImp(explCamera))

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (onChange) onChange(e)
      }
      controls?.addEventListener?.('change', callback)
      return () => controls?.removeEventListener?.('change', callback)
    }, [onChange, controls, invalidate])

    useFrame(() => controls?.update(), -1)

    React.useEffect(() => {
      const current = controls
      current?.connect()
      return () => current?.dispose()
    }, [controls])

    return controls ? <primitive ref={ref} object={controls} {...rest} /> : null
  }
)

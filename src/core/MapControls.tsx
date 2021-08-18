import { ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { MapControls as MapControlsImpl } from 'three-stdlib'

export type MapControlsProps = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<MapControlsImpl, typeof MapControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
    onChange?: (e?: THREE.Event) => void
    onStart?: (e?: THREE.Event) => void
    onEnd?: (e?: THREE.Event) => void
  }
>

export const MapControls = React.forwardRef<MapControlsImpl, MapControlsProps>(
  (props = { enableDamping: true }, ref) => {
    const { camera, onChange, onStart, onEnd, ...rest } = props
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const domElement = useThree(({ gl }) => gl.domElement)

    const explCamera = camera || defaultCamera
    const controls = React.useMemo(() => new MapControlsImpl(explCamera), [explCamera])

    React.useEffect(() => {
      controls.connect(domElement)
      const callback = (e: THREE.Event) => {
        invalidate()
        if (onChange) onChange(e)
      }
      controls.addEventListener('change', callback)

      if (onStart) controls.addEventListener('start', onStart)
      if (onEnd) controls.addEventListener('end', onEnd)

      return () => {
        controls.dispose()
        controls.removeEventListener('change', callback)
        if (onStart) controls.removeEventListener('start', onStart)
        if (onEnd) controls.removeEventListener('end', onEnd)
      }
    }, [onChange, onStart, onEnd, controls, invalidate, domElement])

    useFrame(() => controls.update())

    return <primitive ref={ref} dispose={undefined} object={controls} enableDamping {...rest} />
  }
)
